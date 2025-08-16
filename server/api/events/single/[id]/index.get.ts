import { eq } from 'drizzle-orm'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { events } from '~~/server/database/schema/event-schema'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

export default defineEventHandler(async (event) => {
  const db = useDrizzle()

  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)

  const [foundEvent] = await db
    .select({
      id: events.id,
      name: events.name,
      shortName: events.shortName,
      imageUrl: events.imageUrl,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (!foundEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  return foundEvent
})
