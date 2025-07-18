import { useDrizzle } from "~~/server/database"

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  
  const db = useDrizzle()

  const events = await db.query.events.findMany()
  return events
})
