import type { AvailableStorageType } from '../database/schema/event-schema'

export function buildCoverImageUrl(storageType: AvailableStorageType, eventId: string, filename: string) {
  if (storageType === 'filesystem') {
    return `/events/${eventId}/cover/${filename}`
  }
  else {
    return new URL(filename, useRuntimeConfig().R2EnpointS3).toString()
  }
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
