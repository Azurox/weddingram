import crypto from 'node:crypto'
import { inArray } from 'drizzle-orm'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { getEventById } from '~~/server/service/EventService'
import { getPresignedUploadUrl } from '~~/server/service/R2Service'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

const fileInformationsSchema = z.array(z.object({
  hash: z.string().length(64), // SHA-256 hash of the file
  extension: z.string().max(10),
  contentType: z.string().max(100),
  length: z.number(),
})).max(5)

export default defineEventHandler(async (event) => {
  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const fileInformations = await readValidatedBody(event, fileInformationsSchema.parse)
  const session = await requireUserSession(event)

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

  if (weddingEvent.bucketType !== 'R2') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event received inquiry upload but does not need presigned urls',
    })
  }

  const db = useDrizzle()
  const signedPayloads: { url: string, isDuplicate: boolean, payload: { filename: string, id: string, contentType: string, length: number, hash: string }, headers: Record<string, string> }[] = []

  const existingPictureHashes = await db.query.pictures.findMany({
    where: (pictures, { eq, and }) => and(
      eq(pictures.eventId, eventId),
      inArray(pictures.pictureHash, fileInformations.map(fi => fi.hash)),
    ),
    columns: {
      pictureHash: true,
    },
  }).then(results => results.map(r => r.pictureHash))

  for (let i = 0; i < fileInformations.length; i++) {
    const fileInformation = fileInformations[i]

    if (existingPictureHashes.includes(fileInformation.hash)) {
      signedPayloads.push({
        url: '',
        payload: {
          filename: '',
          id: '',
          contentType: fileInformation.contentType,
          length: fileInformation.length,
          hash: fileInformation.hash,
        },
        isDuplicate: true,
        headers: {},
      })
      continue
    }

    const pictureId = crypto.randomUUID()

    const filename = `${pictureId}.${fileInformation.extension}`

    const customHeadersForMetadata = {
      'x-amz-meta-eventid': eventId,
      'x-amz-meta-guestid': session.user.id,
    }

    const url = await getPresignedUploadUrl(filename, fileInformation.contentType, fileInformation.length, {
      eventId,
      guestId: session.user.id,
    }, customHeadersForMetadata)

    signedPayloads.push({
      url,
      payload: {
        filename,
        id: pictureId,
        contentType: fileInformation.contentType,
        length: fileInformation.length,
        hash: fileInformation.hash,
      },
      headers: {
        ...customHeadersForMetadata,
        'Content-Type': fileInformation.contentType,
      },
      isDuplicate: false,
    })
  }

  return signedPayloads
})
