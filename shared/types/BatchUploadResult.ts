export interface UploadedMedia {
  id: string
  url: string
  deleteId: string
  thumbnailUrl: string | null
  isVideo: boolean
}

export interface DuplicateMedia {
  hash: string
  name?: string
  file?: string
  contentType?: string
}

export interface InvalidFile {
  name?: string
  contentType?: string
  reason: string
  hash: string
}

export interface BatchUploadResult {
  uploadedMedia: UploadedMedia[]
  duplicateMedia: DuplicateMedia[]
  invalidFiles: InvalidFile[]
}
