import { useDrizzle } from "~~/server/database"
import { events } from "~~/server/database/schema/event-schema"
import { eq } from "drizzle-orm"
import z from "zod"


const eventIdRouterParam = z.uuid()

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const eventId = await getValidatedRouterParams(event, eventIdRouterParam.parse)

  const db = useDrizzle()
  await db.delete(events).where(eq(events.id, eventId))
  // TODO delete cover image from storage
  // TODO delete all event photos from storage

  setResponseStatus(event, 204)
})
