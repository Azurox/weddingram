import z from "zod"
import { useDrizzle } from "~~/server/database"
import { guests } from "~~/server/database/schema/guest-schema"


const eventIdRouterParam = z.uuid()
const registerEventRequestSchema = z.object({
  nickname: z.string().max(255),
})

export default defineEventHandler(async (event) => {

  const eventId = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const { nickname } = await readValidatedBody(event, body => registerEventRequestSchema.parse(body))

  const [guest] = await useDrizzle().insert(guests).values({
    eventId,
    nickname,
  }).returning({
    id: guests.id,
  })

  await setUserSession(event, {
    user: {
      name: nickname,
      id: guest.id,
    },
    secure: {
      eventId,
    }
  })

  setResponseStatus(event, 204)
})
