import z from "zod"
import { useDrizzle } from "~~/server/database"
import { pictures } from "~~/server/database/schema/picture-schema"
import { guests } from "~~/server/database/schema/guest-schema"
import { getEventById } from "~~/server/service/EventService"
import { eq } from "drizzle-orm"

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
      eq(pictures.eventId, eventId)
    )

  // Filter the results to only include requested picture IDs
  const filteredPictures = picturesList.filter(picture => 
    validatedBody.pictureIds.includes(picture.id)
  )

  // Return pictures in the same order as requested IDs, with null for missing ones
  const orderedPictures = validatedBody.pictureIds.map(id => {
    return filteredPictures.find(picture => picture.id === id) || null
  })

  return {
    pictures: orderedPictures,
    requestedCount: validatedBody.pictureIds.length,
    foundCount: filteredPictures.length,
  }
})
