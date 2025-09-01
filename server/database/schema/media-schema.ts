import type { SQL } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import { bigint, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { events } from './event-schema'
import { guests } from './guest-schema'

export const medias = pgTable('medias', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  filename: varchar('filename', { length: 64 }).notNull().unique(), // Technically could be 32 characters + extension length
  size: bigint('size', { mode: 'number' }).notNull(),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  guestId: uuid('guest_id').notNull().references(() => guests.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  pictureHash: varchar('picture_hash', { length: 64 }).notNull(),

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
