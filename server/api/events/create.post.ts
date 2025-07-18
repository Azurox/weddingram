import { useDrizzle } from "~~/server/database"
import type { EventState} from "~~/server/database/schema/event-schema";
import { events } from "~~/server/database/schema/event-schema"
import { createInsertSchema  } from 'drizzle-zod';

const createEventRequestSchema = createInsertSchema(events);

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  
  const db = useDrizzle()

  const {name, shortName, imageUrl, bucketUri, bucketType, startDate, endDate  } = await readValidatedBody(event, body => createEventRequestSchema.parse(body))

  const now = new Date()
  let state: EventState = "draft"

  if(startDate >= now) {
    state = 'started'
  }

  const [createdEvent] = await db.insert(events).values({
    name,
    shortName,
    imageUrl,
    bucketUri,
    bucketType,
    state,
    startDate,
    endDate,
  }).returning({
    id: events.id,
  })

  return createdEvent
})
