import z from "zod"
import { useDrizzle } from "~~/server/database"
import { pictures } from "~~/server/database/schema/picture-schema"
import { guests } from "~~/server/database/schema/guest-schema"
import { getEventById } from "~~/server/service/EventService"
import { eq, and, inArray } from "drizzle-orm"

const eventIdRouterParam = z.uuid()

const bodySchema = z.object({
  pictureIds: z.array(z.string().uuid()).min(1).max(100),
})

export default defineEventHandler(async (event) => {
  const eventId = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { pictureIds } = await readBody(event)
  
  // Validate the request body
  const validatedBody = bodySchema.parse({ pictureIds })

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
        inArray(pictures.id, validatedBody.pictureIds)
      )
    )


  return picturesList
})
