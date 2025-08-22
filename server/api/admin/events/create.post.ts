import type { ServerFile } from 'nuxt-file-storage'
import type { AvailableStorageType, EventState } from '~~/server/database/schema/event-schema'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { useDrizzle } from '~~/server/database'
import { eventBucketType, events } from '~~/server/database/schema/event-schema'
import { buildFileStorageCoverUrl, getCoverImageFolder } from '~~/server/service/ImageService'
import { persistPublicPictureFile } from '~~/server/service/R2Service'

const createEventRequestSchema = z.object({
  name: z.string().max(255),
  shortName: z.string().max(8).optional(),
  image: z.any().optional(), // this is a ServerFile type | There is probably a better way to do this
  bucketUri: z.string().max(2048).optional(),
  bucketType: z.enum(eventBucketType.enumValues),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

// TODO should be protected by auth admin only
export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const db = useDrizzle()

  const { name, shortName, image, bucketUri, bucketType, startDate, endDate } = await readValidatedBody(event, body => createEventRequestSchema.parse(body))
  const coverImage: ServerFile | undefined = image

  const now = new Date()
  let state: EventState = 'draft'

  if (startDate >= now) {
    state = 'started'
  }

  // 3 month from now
  const closeDate = new Date()
  closeDate.setMonth(closeDate.getMonth() + 3)

  const [createdEvent] = await db.insert(events).values({
    name,
    shortName: shortName ?? name.slice(0, 8),
    bucketUri: bucketUri ?? '', // Actually not used for now as R2 is not implemented yet
    bucketType,
    state,
    startDate,
    endDate,
    closeDate,
  }).returning({
    id: events.id,
  })

  if (coverImage) {
    const savedImageUrl = await saveCoverImage(bucketType, coverImage, createdEvent.id)

    await db.update(events).set({
      imageUrl: savedImageUrl,
      updatedAt: new Date(),
    }).where(eq(events.id, createdEvent.id))
  }

  return createdEvent
})

async function saveCoverImage(storageType: AvailableStorageType, file: ServerFile, eventId: string) {
  const folder = getCoverImageFolder(storageType, eventId)

  if (storageType === 'filesystem') {
    const filename = await storeFileLocally(
      file,
      eventId,
      getCoverImageFolder('filesystem', eventId),
    )

    return buildFileStorageCoverUrl(eventId, filename)
  }
  else {
    const coverUrl = await persistPublicPictureFile(`${folder}${file.name}`, file, {
      eventId,
    })

    return coverUrl
  }
}
