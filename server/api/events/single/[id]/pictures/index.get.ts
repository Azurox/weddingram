import z from "zod"
import { useDrizzle } from "~~/server/database"
import { pictures } from "~~/server/database/schema/picture-schema"
import { guests } from "~~/server/database/schema/guest-schema"
import { getEventById } from "~~/server/service/EventService"
import { eq, desc, asc, sql } from "drizzle-orm"

const eventIdRouterParam = z.uuid()

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['capturedAt', 'createdAt']).default('capturedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type UploadedPicture = {
    id: string;
    url: string;
    capturedAt: Date;
    createdAt: Date;
    guestId: string;
    guestNickname: string | null;
}

export default defineEventHandler(async (event) => {
  const eventId = await getValidatedRouterParams(event, eventIdRouterParam.parse)
  const query = await getValidatedQuery(event, querySchema.parse)

  // Verify event exists
  const weddingEvent = await getEventById(eventId)
  if (!weddingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  const db = useDrizzle()
  
  // Calculate offset for pagination
  const offset = (query.page - 1) * query.limit

  // Determine sort column and order
  const sortColumn = query.sortBy === 'capturedAt' ? pictures.capturedAt : pictures.createdAt
  const sortOrder = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

  // Get total count for pagination metadata
  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pictures)
    .where(eq(pictures.eventId, eventId))

  // Get paginated pictures - ALL pictures for the event with guest information
  const picturesList: UploadedPicture[] = await db
    .select({
      id: pictures.id,
      url: pictures.url,
      capturedAt: pictures.capturedAt,
      createdAt: pictures.createdAt,
      guestId: pictures.guestId,
      guestNickname: guests.nickname,
    })
    .from(pictures)
    .leftJoin(guests, eq(pictures.guestId, guests.id))
    .where(eq(pictures.eventId, eventId))
    .orderBy(sortOrder)
    .limit(query.limit)
    .offset(offset)

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount.count / query.limit)
  const hasNextPage = query.page < totalPages
  const hasPreviousPage = query.page > 1

  return {
    pictures: picturesList,
    pagination: {
      currentPage: query.page,
      totalPages,
      totalCount: totalCount.count,
      limit: query.limit,
      hasNextPage,
      hasPreviousPage,
    },
    sorting: {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  }
})
