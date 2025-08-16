import { relations } from 'drizzle-orm'
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { events } from './event-schema'
import { pictures } from './picture-schema'

export const guests = pgTable('guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  nickname: varchar('nickname', { length: 32 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
})

export const guestsRelations = relations(guests, ({ many }) => ({
  pictures: many(pictures),
}))
