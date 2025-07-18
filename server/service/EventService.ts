import { useDrizzle } from "../database";
import { events } from "../database/schema/event-schema";
import { eq } from "drizzle-orm";

export async function getEventById(eventId: string) {
  return await useDrizzle().query.events.findFirst({
    where: eq(events.id, eventId),
  })
}