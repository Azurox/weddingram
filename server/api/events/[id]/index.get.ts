import { useDrizzle } from "~~/server/database"
import { events } from "~~/server/database/schema/event-schema"
import { eq } from "drizzle-orm"
import z from "zod"

const eventIdRouterParam = z.object({
  id: z.uuid()
})

export default defineEventHandler(async (event) => {
  const db = useDrizzle()
  
  const {id: eventId} = await getValidatedRouterParams(event, eventIdRouterParam.parse)

  const [foundEvent] = await db
    .select({
      id: events.id,
      name: events.name,
      shortName: events.shortName,
      imageUrl: events.imageUrl,
      bucketType: events.bucketType,
      bucketUri: events.bucketUri,
      state: events.state,
      startDate: events.startDate,
      endDate: events.endDate,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (!foundEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found"
    })
  }

  return foundEvent
})