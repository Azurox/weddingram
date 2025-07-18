import type { ServerFile } from "nuxt-file-storage"
import z from "zod"
import type { events } from "~~/server/database/schema/event-schema"
import { getEventById } from "~~/server/service/EventService"
import crypto from "crypto"
import path from "path"
import { useDrizzle } from "~~/server/database"
import { pictures } from "~~/server/database/schema/picture-schema"
import ExifReader from 'exifreader';

const eventIdRouterParam = z.uuid()

// Currently this method only supports filesystem storage
// We may need to change how we answer to the client so it's not blocking, maybe making the client send image one by one or using websocket or a stream response
// https://github.com/nitrojs/nitro/issues/1327 Send multiples {} as a stream response
// Or use SSE
export default defineEventHandler(async (event) => {

  const eventId = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { files } = await readBody<{ files: ServerFile[] }>(event)
  const session = await requireUserSession(event)

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
  const uploadedFilesResult: Record<number, {status: string, message?: string}> = {}

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

    const pictureId = crypto.randomUUID()
    
    await savePictureInBucket(pictureId, file, weddingEvent)
    const exifData = await extractExifData(file)
    await db.insert(pictures).values({
      eventId,
      id: pictureId,
      guestId: session.user.id,
      url: path.join(weddingEvent.bucketUri, file.name),
      capturedAt: exifData.capturedAt,
    })

    uploadedFilesResult[index] = {
      status: 'success',
    }
  }

  setResponseStatus(event, 204)
})


async function savePictureInBucket(pictureId: string, file: ServerFile, weddingEvent: typeof events.$inferSelect) {
  if (weddingEvent.bucketType === 'filesystem') {
    await storeFileLocally(
      file,
      pictureId,
      weddingEvent.bucketUri  
    )
  } else {
    throw createError({
      statusCode: 501,
      statusMessage: 'R2 bucket not implemented yet',
    })
  }
}

async function extractExifData(file: ServerFile) {
  try {
    const tags = await ExifReader.load(file.content);
    return {
      capturedAt: tags.DateTimeOriginal ? new Date(tags.DateTimeOriginal.description) : new Date(),
    }
  } catch (error) {
    console.error('Error extracting EXIF data:', error)
    return {
      capturedAt: new Date(), // Fallback to current date if EXIF data extraction fails
    }
  }
}