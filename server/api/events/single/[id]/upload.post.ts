import type { ServerFile } from 'nuxt-file-storage'
import type { UploadResult } from '~/services/UploadStrategyService'
import z from 'zod'
import { getEventById } from '~~/server/service/EventService'
import { PictureUploadOrchestrator } from '~~/server/service/upload/PictureUploadOrchestrator'

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
    filekey: z.string().max(256),
    thumbnailFilekey: z.string().max(256),
    hash: z.string().length(64),
    capturedAt: z.coerce.date().optional(),
  }),
  z.object({
    hash: z.string().length(64), // SHA-256 hash of the file
    capturedAt: z.coerce.date().optional(),
  }).strict(),
])).max(5)

export default defineEventHandler<Promise<UploadResult[]>>(async (event) => {
  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { files, filesInformations } = await readBody<{ files: ServerFile[] | undefined, filesInformations: unknown }>(event)
  const session = await requireUserSession(event)

  const parsedFilesInformations = fileInformationsSchema.parse(filesInformations)

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

  let processedFiles

  if (weddingEvent.bucketType === 'filesystem' && files) {
    // This only happens when user uploads files directly.
    if (files.length && (parsedFilesInformations.length !== files.length)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Files informations count does not match files count',
      })
    }

    processedFiles = PictureUploadOrchestrator.createFromServerFiles(
      files,
      parsedFilesInformations.map(info => ({
        hash: info.hash,
        capturedAt: info.capturedAt,
      })),
    )
  }
  else {
    // R2 upload flow - files have already been uploaded via presigned URLs
    const r2FileInfos = parsedFilesInformations.filter((info): info is {
      extension: string
      contentType: string
      length: number
      id: string
      filename: string
      filekey: string
      thumbnailFilekey: string
      hash: string
      capturedAt?: Date
    } =>
      'filename' in info && 'extension' in info && 'contentType' in info && 'length' in info && 'id' in info,
    )

    if (r2FileInfos.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid R2 file informations provided',
      })
    }

    processedFiles = PictureUploadOrchestrator.createFromR2Inquiry(r2FileInfos)
  }

  // Upload using the orchestrator
  const results = await PictureUploadOrchestrator.uploadPictures(
    processedFiles,
    eventId,
    session.user.id,
    weddingEvent,
  )

  return results
})
