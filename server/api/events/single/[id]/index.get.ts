import z from 'zod'
import { getEventById, getEventPictureCount, mapEventToPublic } from '~~/server/service/EventService'

const eventIdRouterParam = z.object({
  id: z.uuid(),
})

export default defineEventHandler(async (event) => {
  const { id: eventId } = await getValidatedRouterParams(event, eventIdRouterParam.parse)

  const [foundEvent, picturesCount] = await Promise.all([
    getEventById(eventId),
    getEventPictureCount(eventId),
  ])

  if (!foundEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  return mapEventToPublic(foundEvent, picturesCount)
})
