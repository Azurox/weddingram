import type { ServerFile } from 'nuxt-file-storage'
import type { events } from '~~/server/database/schema/event-schema'
import crypto from 'node:crypto'
import ExifReader from 'exifreader'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { pictures } from '~~/server/database/schema/picture-schema'
import { getEventById } from '~~/server/service/EventService'
import { buildUploadedPictureUrl, getUploadedPictureFolder } from '~~/server/service/ImageService'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

const fileInformationsSchema = z.array(z.object({
  hash: z.string().length(64), // SHA-256 hash of the file
})).max(5)

// Currently this method only supports filesystem storage
export default defineEventHandler(async (event) => {
  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { files, filesInformations } = await readBody<{ files: ServerFile[], filesInformations: unknown }>(event)
  const session = await requireUserSession(event)

  const parsedFilesInformations = fileInformationsSchema.parse(filesInformations)

  if (parsedFilesInformations.length !== files.length) {
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

  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No files uploaded',
    })
  }

  const db = useDrizzle()
  const uploadedFilesResult: Record<number, { status: string, message?: string }> = {}
  const pictureRecords: Array<typeof pictures.$inferInsert> = []

  // TODO : Test if spamming the server with too many files per request could causes issues, in such case, implement a global queue system or use a worker thread
  // To verify if its possible in nuxt / nitro, there seems to be poor documentation on this topic
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

      const { url, filename } = await savePictureInBucket(eventId, pictureId, file, weddingEvent)
      const exifData = await extractExifData(file)

      pictureRecords.push({
        filename,
        eventId,
        id: pictureId,
        guestId: session.user.id,
        url,
        capturedAt: exifData.capturedAt,
        pictureHash: parsedFilesInformations[index].hash,
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

  // Batch insert all successfully processed pictures
  if (pictureRecords.length > 0) {
    const insertedPictures = await db.insert(pictures).values(pictureRecords).onConflictDoNothing().returning({
      deleteId: pictures.magicDeleteId,
      id: pictures.id,
      url: pictures.url,
    })

    return insertedPictures
  }

  return []
})

async function savePictureInBucket(eventId: string, pictureId: string, file: ServerFile, weddingEvent: typeof events.$inferSelect) {
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
      statusCode: 501,
      statusMessage: 'R2 bucket not implemented yet',
    })
  }
}

async function extractExifData(file: ServerFile) {
  try {
    const tags = await ExifReader.load(file.content)
    return {
      capturedAt: tags.DateTimeOriginal ? new Date(tags.DateTimeOriginal.description) : new Date(),
    }
  }
  catch (error) {
    console.error('Error extracting EXIF data:', error)
    return {
      capturedAt: new Date(), // Fallback to current date if EXIF data extraction fails
    }
  }
}
