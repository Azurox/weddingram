import type { AvailableStorageType } from '../database/schema/event-schema'

export function buildFileStorageCoverUrl(eventId: string, filename: string) {
  return `/events/${eventId}/cover/${filename}`
}

export function getCoverImageFolder(storageType: AvailableStorageType, eventId: string) {
  if (storageType === 'filesystem') {
    return `public/events/${eventId}/cover/`
  }
  else {
    return `events/${eventId}/cover/`
  }
}

export function getUploadedPictureFolder(eventId: string) {
  return `public/events/${eventId}/pictures/`
}

export function buildUploadedPictureUrl(eventId: string, filename: string) {
  return `events/${eventId}/pictures/${filename}`
}
