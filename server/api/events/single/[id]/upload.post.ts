import type { ServerFile } from 'nuxt-file-storage'
import type { events } from '~~/server/database/schema/event-schema'
import crypto from 'node:crypto'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { pictures } from '~~/server/database/schema/picture-schema'
import { clearEventPictureCountCache, getEventById } from '~~/server/service/EventService'
import { buildUploadedPictureUrl, getUploadedPictureFolder } from '~~/server/service/ImageService'
import { buildPublicUrl, retrieveFileMetadata } from '~~/server/service/R2Service'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

const fileInformationsSchema = z.array(z.union([
  z.object({
    extension: z.string().max(10),
    contentType: z.string().max(100),
    length: z.number(),
    id: z.uuid(),
    filename: z.string().max(64),
    hash: z.string().length(64),
    capturedAt: z.coerce.date().optional(),
  }),
  z.object({
    hash: z.string().length(64), // SHA-256 hash of the file
    capturedAt: z.coerce.date().optional(),
  }).strict(),
])).max(5)

// Currently this method only supports filesystem storage
export default defineEventHandler(async (event) => {
  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { files, filesInformations } = await readBody<{ files: ServerFile[] | undefined, filesInformations: unknown }>(event)
  const session = await requireUserSession(event)

  const parsedFilesInformations = fileInformationsSchema.parse(filesInformations)

  // This only happens when user uploads files directly.
  if (files?.length && (parsedFilesInformations.length !== files.length)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Files informations count does not match files count',
    })
  }

  if (!session.user.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const weddingEvent = await getEventById(eventId)

  if (!weddingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  const db = useDrizzle()
  const uploadedFilesResult: Record<number, { status: string, message?: string }> = {}
  const pictureRecords: Array<typeof pictures.$inferInsert> = []

  if (weddingEvent.bucketType === 'filesystem' && files) {
    for (const [index, file] of files.entries()) {
      if (!file || !file.name || !file.content) {
        uploadedFilesResult[index] = {
          status: 'error',
          message: 'Invalid file',
        }
        continue
      }

      try {
        const pictureId = crypto.randomUUID()

        const { url, filename } = await savePictureInLocalBucket(eventId, pictureId, file, session.user.id, weddingEvent)

        pictureRecords.push({
          filename,
          eventId,
          id: pictureId,
          guestId: session.user.id,
          url,
          capturedAt: parsedFilesInformations[index].capturedAt,
          pictureHash: parsedFilesInformations[index].hash,
          size: Number(file.size),
        })

        uploadedFilesResult[index] = {
          status: 'success',
        }
      }
      catch (error) {
        console.error(`Error processing file ${index}:`, error)
        uploadedFilesResult[index] = {
          status: 'error',
          message: 'Failed to process file',
        }
      }
    }
  }
  else {
    for (let i = 0; i < parsedFilesInformations.length; i++) {
      const informations = parsedFilesInformations[i]

      if (!('filename' in informations))
        continue

      try {
        const pictureUploadResult = await verifyPictureWasUploaded(informations, eventId, session.user.id)

        if (!pictureUploadResult.success) {
          uploadedFilesResult[i] = {
            status: 'error',
            message: 'Picture was not properly uploaded',
          }
          continue
        }
        else {
          pictureRecords.push({
            filename: informations.filename,
            eventId,
            id: informations.id,
            guestId: session.user.id,
            url: pictureUploadResult.url,
            capturedAt: informations.capturedAt,
            pictureHash: informations.hash,
            size: pictureUploadResult.actualSize,
          })
        }
      }
      catch (error) {
        console.error(`Error verifying uploaded file ${i}:`, error)
        uploadedFilesResult[i] = {
          status: 'error',
          message: 'Failed to verify uploaded file',
        }
        continue
      }
    }
  }

  // Batch insert all successfully processed pictures
  if (pictureRecords.length > 0) {
    const insertedPictures = await db.insert(pictures).values(pictureRecords).onConflictDoNothing().returning({
      deleteId: pictures.magicDeleteId,
      id: pictures.id,
      url: pictures.url,
    })

    await clearEventPictureCountCache(eventId)

    return insertedPictures
  }

  return []
})

async function savePictureInLocalBucket(eventId: string, pictureId: string, file: ServerFile, guestId: string, weddingEvent: typeof events.$inferSelect) {
  if (weddingEvent.bucketType === 'filesystem') {
    const filename = await storeFileLocally(
      file,
      pictureId,
      getUploadedPictureFolder(eventId),
    )

    return {
      url: buildUploadedPictureUrl(eventId, filename),
      filename,
    }
  }
  else {
    throw createError({
      statusCode: 500,
      statusMessage: 'Event with R2 bucket type does not support direct upload',
    })
  }
}

async function verifyPictureWasUploaded(fileInformation: z.infer<typeof fileInformationsSchema>[number], eventId: string, guestId: string) {
  if (!('filename' in fileInformation)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File information does not come from inquiry upload',
    })
  }

  const fileMetadata = await retrieveFileMetadata(fileInformation.filename)
  if (fileMetadata.Metadata && 'eventid' in fileMetadata.Metadata && 'guestid' in fileMetadata.Metadata) {
    if (fileMetadata.Metadata.eventid !== eventId || fileMetadata.Metadata.guestid !== guestId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File metadata does not match event or guest',
        data: { expectedEventId: eventId, expectedGuestId: guestId, actualEventId: fileMetadata.Metadata.eventid, actualGuestId: fileMetadata.Metadata.guestid },
      })
    }
    else {
      return {
        success: true,
        actualSize: Number(fileMetadata.ContentLength),
        url: buildPublicUrl(fileInformation.filename),
      }
    }
  }
  else {
    throw createError({
      statusCode: 400,
      statusMessage: 'File metadata is missing eventId or guestId',
    })
  }
}
