import { count, eq } from 'drizzle-orm'
import { useDrizzle } from '../database'
import { events } from '../database/schema/event-schema'
import { pictures } from '../database/schema/picture-schema'

export async function getRawEventById(eventId: string) {
  return await useDrizzle().query.events.findFirst({
    where: eq(events.id, eventId),
  })
}

export const getEventById = defineCachedFunction(async (eventId: string) => {
  const data = getRawEventById(eventId)
  return data
}, {
  maxAge: 60 * 60,
  name: 'getById',
  getKey: (eventId: string) => `event:${eventId}`,
})

export function mapEventToPublic(event: NonNullable<Awaited<ReturnType<typeof getEventById>>>, pictureCount?: number) {
  return {
    id: event.id,
    name: event.name,
    shortName: event.shortName,
    startDate: event.startDate,
    endDate: event.endDate,
    imageUrl: event.imageUrl,
    pictureCount,
    eventUrl: getEventUrl(event.id),
  }
}

export async function getRawEventPictureCount(eventId: string) {
  const db = useDrizzle()
  const [result] = await db
    .select({ count: count() })
    .from(pictures)
    .where(eq(pictures.eventId, eventId))

  return result.count
}

export const getEventPictureCount = defineCachedFunction(async (eventId: string) => {
  const data = getRawEventPictureCount(eventId)
  return data
}, {
  maxAge: 60 * 60,
  name: 'getPictureCount',
  getKey: (eventId: string) => `event:${eventId}`,
})

export async function clearEventPictureCountCache(eventId: string) {
  await useStorage('cache').removeItem(`nitro:functions:getPictureCount:event:${eventId}.json`)
}

export function getEventUrl(eventId: string) {
  const applicationDomain = useRuntimeConfig().applicationDomain
  return `${applicationDomain}/event/${eventId}`
}
