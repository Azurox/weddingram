import type { SQL } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import { bigint, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { events } from './event-schema'
import { guests } from './guest-schema'

export const pictures = pgTable('pictures', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  filename: varchar('filename', { length: 64 }).notNull().unique(), // Technically could be 32 characters + extension length
  size: bigint('size', { mode: 'number' }).notNull(),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  guestId: uuid('guest_id').notNull().references(() => guests.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  pictureHash: varchar('picture_hash', { length: 64 }).notNull(),
  generatedUniquePictureHash: text('generated_unique_picture_hash')
    .generatedAlwaysAs((): SQL => sql`${pictures.eventId} || ${pictures.pictureHash}`)
    .unique(),
  magicDeleteId: uuid('magic_delete_id').defaultRandom().notNull(),
})

export const picturesRelations = relations(pictures, ({ one }) => ({
  owner: one(guests, {
    fields: [pictures.guestId],
    references: [guests.id],
  }),
  event: one(events, {
    fields: [pictures.eventId],
    references: [events.id],
  }),
}))
