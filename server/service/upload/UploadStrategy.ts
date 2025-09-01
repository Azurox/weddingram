import type { events } from '~~/server/database/schema/event-schema'
import type { pictures } from '~~/server/database/schema/media-schema'

export interface ProcessedFileInfo {
  hash: string
  extension: string
  contentType: string
  length: number
  capturedAt?: Date
  file?: unknown
}

export interface R2ProcessedFileInfo extends ProcessedFileInfo {
  id: string
  filename: string
}

export interface UploadResult {
  id: string
  url: string
  deleteId: string
}

export interface UploadStrategy {
  uploadFiles: (
    files: ProcessedFileInfo[],
    eventId: string,
    guestId: string,
    event: typeof events.$inferSelect
  ) => Promise<UploadResult[]>

  requiresPresignedUrls: () => boolean
}

export interface PictureRecord extends Omit<typeof pictures.$inferInsert, 'id'> {
  id: string
  deleteId: string
}
