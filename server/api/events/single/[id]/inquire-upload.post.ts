import crypto from 'node:crypto'
import { inArray } from 'drizzle-orm'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { getEventById } from '~~/server/service/EventService'
import { buildR2UploadedPictureUrl, buildR2UploadedThumbnailUrl, isMediaVideoContent } from '~~/server/service/ImageService'
import { getPresignedUploadUrl } from '~~/server/service/R2Service'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

export interface InquirePayload {
  url: string
  thumbnailUrl: string | null
  isDuplicate: boolean
  payload: {
    filename: string
    filekey: string
    thumbnailFilekey: string | null
    id: string
    contentType: string
    length: number
    hash: string
  }
  headers: Record<string, string>
}

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
  const signedPayloads: InquirePayload[] = []

  const existingPictureHashes = await db.query.medias.findMany({
    where: (medias, { eq, and }) => and(
      eq(medias.eventId, eventId),
      inArray(medias.pictureHash, fileInformations.map(fi => fi.hash)),
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
        thumbnailUrl: '',
        payload: {
          filename: '',
          filekey: '',
          thumbnailFilekey: '',
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
    const filekey = buildR2UploadedPictureUrl(eventId, filename)
    const isVideoUpload = isMediaVideoContent(fileInformation.contentType)
    const thumbnailFilekey = isVideoUpload ? null : buildR2UploadedThumbnailUrl(eventId, `${pictureId}.jpeg`)

    // For videos, we might not have a thumbnail

    // Custom headers to store metadata in R2 object
    const customHeadersForMetadata = {
      'x-amz-meta-eventid': eventId,
      'x-amz-meta-guestid': session.user.id,
    }

    const getSignedUrlPromise = getPresignedUploadUrl(filekey, fileInformation.contentType, fileInformation.length, {
      eventId,
      guestId: session.user.id,
    }, customHeadersForMetadata)

    const getSignedThumbnailUrlPromise = thumbnailFilekey === null
      ? Promise.resolve(null)
      : getPresignedUploadUrl(thumbnailFilekey, fileInformation.contentType, fileInformation.length, {
          eventId,
          guestId: session.user.id,
        }, customHeadersForMetadata)

    const [url, thumbnailUrl] = await Promise.all([getSignedUrlPromise, getSignedThumbnailUrlPromise])

    signedPayloads.push({
      url,
      thumbnailUrl,
      payload: {
        filename,
        filekey,
        thumbnailFilekey,
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
