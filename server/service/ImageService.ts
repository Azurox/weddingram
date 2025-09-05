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
  return `public/events/${eventId}/medias/`
}

export function getUploadedThumbnailFolder(eventId: string) {
  return `public/events/${eventId}/thumbnails/`
}

export function buildR2UploadedPictureUrl(eventId: string, filename: string) {
  return `events/${eventId}/medias/${filename}`
}

export function buildFilesystemUploadedPictureUrl(eventId: string, filename: string) {
  return `/events/${eventId}/medias/${filename}`
}

export function buildR2UploadedThumbnailUrl(eventId: string, filename: string) {
  return `events/${eventId}/thumbnails/${filename}`
}

export function buildFilesystemUploadedThumbnailUrl(eventId: string, filename: string) {
  return `/events/${eventId}/thumbnails/${filename}`
}

export function isMediaVideoContent(contentType: string) {
  return contentType.startsWith('video/')
}

export function isValidMediaContent(contentType: string): boolean {
  const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
  ]

  const allowedVideoTypes = [
    'video/mp4',
    'video/quicktime',
    'video/3gpp',
    'video/webm',
  ]

  return allowedImageTypes.includes(contentType) || allowedVideoTypes.includes(contentType)
}
