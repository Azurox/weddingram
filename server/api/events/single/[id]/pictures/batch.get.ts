import { and, eq, inArray } from 'drizzle-orm'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { guests } from '~~/server/database/schema/guest-schema'
import { medias } from '~~/server/database/schema/media-schema'
import { getEventById } from '~~/server/service/EventService'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

const bodySchema = z.object({
  pictureIds: z.union([
    z.uuid(),
    z.array(z.string()),
  ]).transform(val => Array.isArray(val) ? val : [val]).pipe(
    z.array(z.uuid()),
  ),
})

export default defineEventHandler(async (event) => {
  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { pictureIds } = await getValidatedQuery(event, bodySchema.parse)

  // Validate the request body

  // Verify event exists
  const weddingEvent = await getEventById(eventId)
  if (!weddingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  const db = useDrizzle()

  // Get pictures by IDs that belong to the specified event with guest information
  const picturesList = await db
    .select({
      id: medias.id,
      url: medias.url,
      capturedAt: medias.capturedAt,
      createdAt: medias.createdAt,
      guestId: medias.guestId,
      guestNickname: guests.nickname,
    })
    .from(medias)
    .leftJoin(guests, eq(medias.guestId, guests.id))
    .where(
      and(
        eq(medias.eventId, eventId),
        inArray(medias.id, pictureIds),
      ),
    )

  return picturesList
})
