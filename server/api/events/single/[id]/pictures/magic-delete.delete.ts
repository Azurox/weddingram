import { and, eq, inArray } from 'drizzle-orm'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { medias } from '~~/server/database/schema/media-schema'
import { PictureDeletionOrchestrator } from '~~/server/service/deletion/PictureDeletionOrchestrator'
import { getEventById } from '~~/server/service/EventService'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

const deleteRequestSchema = z.object({
  magicDeleteIds: z.array(z.uuid()).min(1),
})

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

  const weddingEvent = await getEventById(eventId)
  if (!weddingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  // Find pictures that match the magic delete IDs and belong to the current user and event
  const picturesToDelete = await db
    .select()
    .from(medias)
    .where(
      and(
        inArray(medias.magicDeleteId, parsedRequest.magicDeleteIds),
        eq(medias.eventId, eventId),
      ),
    )

  if (picturesToDelete.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No pictures found with the provided delete IDs',
      data: { requestedIds: parsedRequest.magicDeleteIds },
    })
  }

  try {
    const deletedPictures = await db
      .delete(medias)
      .where(
        and(
          inArray(medias.magicDeleteId, parsedRequest.magicDeleteIds),
          eq(medias.eventId, eventId),
        ),
      )
      .returning({
        url: medias.url,
        filename: medias.filename,
        magicDeleteId: medias.magicDeleteId,
      })

    const deletionResult = await PictureDeletionOrchestrator.deletePictures(
      deletedPictures,
      weddingEvent,
    )

    if (deletionResult.errors.length > 0) {
      console.warn('Some files could not be deleted from storage:', deletionResult.errors)
    }

    return {
      success: true,
      deletedCount: deletedPictures.length,
      deletedIds: deletedPictures.map(p => p.magicDeleteId),
      storageErrors: deletionResult.errors.length > 0 ? deletionResult.errors : undefined,
    }
  }
  catch (error) {
    console.error('Error during picture deletion:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete pictures',
    })
  }
})
