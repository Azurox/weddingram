import { useDrizzle } from "~~/server/database"
import type { EventState } from "~~/server/database/schema/event-schema";
import { eventBucketType, events } from "~~/server/database/schema/event-schema"
import z from "zod";
import type { ServerFile } from "nuxt-file-storage";
import { eq } from "drizzle-orm";
import { buildCoverImageUrl, getCoverImageFolder } from "~~/server/service/ImageService";

const createEventRequestSchema = z.object({
  name: z.string().max(255),
  shortName: z.string().max(8).optional(),
  image: z.any().optional(), // this is a ServerFile type | There is probably a better way to do this
  bucketUri: z.string().max(2048).optional(),
  bucketType: z.enum(eventBucketType.enumValues),
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const db = useDrizzle()

  const { name, shortName, image, bucketUri, bucketType, startDate, endDate } = await readValidatedBody(event, body => createEventRequestSchema.parse(body))

  const now = new Date()
  let state: EventState = "draft"

  if (startDate >= now) {
    state = 'started'
  }

  const [createdEvent] = await db.insert(events).values({
    name: name,
    shortName: shortName ?? name.slice(0, 8),
    bucketUri: bucketUri ?? '', // Actually not used for now as R2 is not implemented yet
    bucketType,
    state,
    startDate,
    endDate,
  }).returning({
    id: events.id,
  })

  if (image) {
    const savedImageUrl = await saveCoverImage(image, createdEvent.id)
    await db.update(events).set({
      imageUrl: savedImageUrl,
      updatedAt: new Date()
    }).where(eq(events.id, createdEvent.id))
  }
  
  return createdEvent
})


async function saveCoverImage(file: ServerFile, eventId: string) {
  const fileName = await storeFileLocally(
    file,
    eventId,
    getCoverImageFolder(eventId)
  )

  return buildCoverImageUrl(eventId, fileName,)
}