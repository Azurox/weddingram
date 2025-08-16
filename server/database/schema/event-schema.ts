import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { guests } from './guest-schema'
import { pictures } from './picture-schema'

export const eventState = pgEnum('event_state', ['draft', 'started', 'done'])
export type EventState = typeof eventState.enumValues[number]
export const eventBucketType = pgEnum('event_bucket_type', ['R2', 'filesystem'])
export type EventBucketType = typeof eventBucketType.enumValues[number]

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  state: eventState('state').notNull().default('draft').notNull(),
  imageUrl: text('image_url'),
  shortName: varchar('short_name', { length: 8 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  bucketType: eventBucketType('bucket_type').notNull().default('R2').notNull(),
  bucketUri: varchar('bucket_uri', { length: 2048 }).notNull(),
})

export const eventsRelations = relations(events, ({ many }) => ({
  pictures: many(pictures),
  guests: many(guests),
}))
