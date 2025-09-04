import type { SQL } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import { bigint, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { events } from './event-schema'
import { guests } from './guest-schema'

export const mediaType = pgEnum('media_type', ['video', 'picture'])
export type MediaType = typeof mediaType.enumValues[number]

export const medias = pgTable('medias', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  filename: varchar('filename', { length: 64 }).notNull().unique(), // Technically could be 32 characters + extension length
  size: bigint('size', { mode: 'number' }).notNull(),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  guestId: uuid('guest_id').notNull().references(() => guests.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  pictureHash: varchar('picture_hash', { length: 64 }).notNull(),
  mediaType: mediaType('media_type').default('picture').notNull(),
  generatedUniquePictureHash: text('generated_unique_picture_hash')
    .generatedAlwaysAs((): SQL => sql`${medias.eventId} || ${medias.pictureHash}`)
    .unique(),
  magicDeleteId: uuid('magic_delete_id').defaultRandom().notNull(),
})

export const mediasRelations = relations(medias, ({ one }) => ({
  owner: one(guests, {
    fields: [medias.guestId],
    references: [guests.id],
  }),
  event: one(events, {
    fields: [medias.eventId],
    references: [events.id],
  }),
}))
