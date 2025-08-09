import z from "zod"
import { useDrizzle } from "~~/server/database"
import { pictures } from "~~/server/database/schema/picture-schema"
import { guests } from "~~/server/database/schema/guest-schema"
import { getEventById } from "~~/server/service/EventService"
import { eq, and, inArray } from "drizzle-orm"


const eventIdRouterParam = z.object({
  id: z.uuid()
})

const bodySchema = z.object({
  pictureIds: z.union([
    z.uuid(),
    z.array(z.string())
  ]).transform((val) => Array.isArray(val) ? val : [val]).pipe(
    z.array(z.uuid())
  ),
})

export default defineEventHandler(async (event) => {
  const {id: eventId} = await getValidatedRouterParams(event, eventIdRouterParam.parse)
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
      id: pictures.id,
      url: pictures.url,
      capturedAt: pictures.capturedAt,
      createdAt: pictures.createdAt,
      guestId: pictures.guestId,
      guestNickname: guests.nickname,
    })
    .from(pictures)
    .leftJoin(guests, eq(pictures.guestId, guests.id))
    .where(
      and(
        eq(pictures.eventId, eventId),
        inArray(pictures.id, pictureIds)
      )
    )


  return picturesList
})
