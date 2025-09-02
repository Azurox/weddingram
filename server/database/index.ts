import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import { events, eventsRelations } from './schema/event-schema'
import { guests, guestsRelations } from './schema/guest-schema'
import { medias, mediasRelations } from './schema/media-schema'

const config = useRuntimeConfig()

const schema = {
  events,
  eventsRelations,
  guests,
  guestsRelations,
  medias,
  picturesRelations: mediasRelations,
} as const

type Schema = typeof schema

let db: NodePgDatabase<Schema> | null = null
export function useDrizzle() {
  if (!db) {
    db = drizzle({
      connection: {
        connectionString: config.databaseUrl,
        ssl: false,
      },
      schema,
    })
  }
  return db
}
