import { eq } from 'drizzle-orm'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { events } from '~~/server/database/schema/event-schema'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

// TODO should be protected by auth admin
export default defineEventHandler(async (event) => {
  const db = useDrizzle()

  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)

  const foundEvent = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  })

  if (!foundEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  return foundEvent
})
