import z from "zod"
import { useDrizzle } from "~~/server/database"
import { pictures } from "~~/server/database/schema/picture-schema"
import { eq, inArray, and } from "drizzle-orm"
import type { events } from "~~/server/database/schema/event-schema"
import { getEventById } from "~~/server/service/EventService"
import { getUploadedPictureFolder } from "~~/server/service/ImageService"

const eventIdRouterParam = z.object({
  id: z.uuid()
})

const deleteRequestSchema = z.object({
  magicDeleteIds: z.array(z.uuid()).min(1)
})

async function deletePictureFromBucket(pictureUrl: string, weddingEvent: typeof events.$inferSelect) {
  if (weddingEvent.bucketType === 'filesystem') {
    await deleteFile(pictureUrl, getUploadedPictureFolder(weddingEvent.id))
  } else {
    throw createError({
      statusCode: 501,
      statusMessage: 'R2 bucket not implemented yet',
    })
  }
}

export default defineEventHandler(async (event) => {
  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { magicDeleteIds } = await readBody<{ magicDeleteIds: string[] }>(event)
  
  const parsedRequest = deleteRequestSchema.parse({ magicDeleteIds })
  const session = await requireUserSession(event)

  if (!session.user.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const db = useDrizzle()

  try {

    const event = await getEventById(eventId)
    if (!event) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found',
      })
    }

    // Find pictures that match the magic delete IDs and belong to the current user and event
    const picturesToDelete = await db
      .select()
      .from(pictures)
      .where(
        and(
          inArray(pictures.magicDeleteId, parsedRequest.magicDeleteIds),
          eq(pictures.guestId, session.user.id),
          eq(pictures.eventId, eventId)
        )
      )

    if (picturesToDelete.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No pictures found with the provided delete IDs',
      })
    }

    // Delete the pictures
    const deletedPictures = await db
      .delete(pictures)
      .where(
        and(
          inArray(pictures.magicDeleteId, parsedRequest.magicDeleteIds),
          eq(pictures.guestId, session.user.id),
          eq(pictures.eventId, eventId)
        )
      )
      .returning({
        url: pictures.url,
        filename: pictures.filename,
        magicDeleteId: pictures.magicDeleteId,
      })


      // Filesystem
      // parallelize that
      for (const picture of deletedPictures) {
        await deletePictureFromBucket(picture.filename, event)
      }

    // TODO: Clean up actual files from storage (filesystem/R2)

    return {
      success: true,
      deletedCount: deletedPictures.length,
      deletedIds: deletedPictures.map(p => p.magicDeleteId)
    }
  } catch (error) {
    console.error('Error deleting pictures:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete pictures',
    })
  }
})
