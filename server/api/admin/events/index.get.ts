import { useDrizzle } from '~~/server/database'

// TODO should be protected by auth admin only
export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const db = useDrizzle()

  const events = await db.query.events.findMany()
  return events
})
