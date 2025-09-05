import type { InquirePayload } from '~~/server/api/events/single/[id]/inquire-upload.post'
import type { EventBucketType } from '~~/server/database/schema/event-schema'
import type { FileProcessingResult } from './FileProcessorService'
import { FetchError } from 'ofetch'
import { FileProcessorService } from './FileProcessorService'

export interface UploadedMedia {
  id: string
  url: string
  deleteId: string
  thumbnailUrl: string | null
  isVideo: boolean
}

export interface DuplicateMedia {
  name: string
  hash: string
  file: string
  contentType: string
}

export interface InvalidFile {
  name: string
  contentType: string
  reason: string
}

export interface BatchUploadResult {
  uploadedMedia: UploadedMedia[]
  duplicateMedia: DuplicateMedia[]
  invalidFiles: InvalidFile[]
}

export interface ClientUploadStrategy {
  upload: (batch: FileProcessingResult[], eventId: string) => Promise<BatchUploadResult>
}

export class FilesystemUploadStrategy implements ClientUploadStrategy {
  async upload(batch: FileProcessingResult[], eventId: string): Promise<BatchUploadResult> {
    const filesInformations = batch.map(item => ({
      hash: item.hash,
      capturedAt: item.capturedAt,
    }))

    if (filesInformations.length === 0) {
      return {
        uploadedMedia: [],
        duplicateMedia: [],
        invalidFiles: [],
      }
    }

    try {
      const uploadedMedia = await $fetch(`/api/events/single/${eventId}/upload`, {
        method: 'POST',
        body: {
          files: batch.map(item => item.file),
          filesInformations,
        },
      })

      return {
        uploadedMedia,
        duplicateMedia: [],
        invalidFiles: [],
      }
    }
    catch (error: unknown) {
      // Rethrow other possible errors
      if (!(error instanceof FetchError) || error.status !== 422)
        throw error

      const duplicateMedia: DuplicateMedia[] = []
      const invalidFiles: InvalidFile[] = []

      const typedError = error as FetchError<{ data: { duplicates?: Array<{ hash: string }>, invalidFiles?: Array<{ hash: string, reason: string }>, uploaded?: UploadedMedia[] } }>
      const errorPayload = typedError.data?.data

      if (errorPayload === undefined || errorPayload.duplicates === undefined || errorPayload.invalidFiles === undefined) {
        throw error
      }

      errorPayload.duplicates.forEach((dup: { hash: string }, index: number) => {
        const file = batch[index]
        if (file && typeof file.file.content === 'string') {
          duplicateMedia.push({
            name: file.file.name,
            hash: dup.hash,
            file: file.file.content,
            contentType: file.file.type,
          })
        }
      })

      errorPayload.invalidFiles.forEach((invalid) => {
        const file = batch.find(f => f.hash === invalid.hash)
        if (file) {
          invalidFiles.push({
            name: file.file.name,
            contentType: file.file.type,
            reason: invalid.reason,
          })
        }
      })

      if (duplicateMedia.length > 0 || invalidFiles.length > 0) {
        return {
          uploadedMedia: typedError.data?.data.uploaded || [],
          duplicateMedia,
          invalidFiles,
        }
      }
      else {
        // This case should not happen, if there is a 422 error, we should have either duplicates or invalid files
        throw error
      }
    }
  }
}

export class R2UploadStrategy implements ClientUploadStrategy {
  async upload(batch: FileProcessingResult[], eventId: string): Promise<BatchUploadResult> {
    // Step 1: Inquire for upload URLs
    const inquiryInformations = batch.map(item => ({
      hash: item.hash,
      extension: item.file.name.split('.').pop() || '',
      contentType: item.file.type,
      length: Number(item.file.size),
    }))

    const inquiryUploadUrls = await $fetch(`/api/events/single/${eventId}/inquire-upload`, {
      method: 'POST',
      body: inquiryInformations,
    })

    // Track duplicates and invalid files from inquiry
    const duplicateMedia: DuplicateMedia[] = []
    const invalidFiles: InvalidFile[] = []

    inquiryUploadUrls.forEach((result: InquirePayload, index: number) => {
      const originalFile = batch[index]
      if (!originalFile)
        return

      if (result.isDuplicate && typeof originalFile.file.content === 'string') {
        duplicateMedia.push({
          name: originalFile.file.name,
          hash: result.payload.hash,
          file: originalFile.file.content, // data URL
          contentType: originalFile.file.type,
        })
      }
      else if (result.isInvalid) {
        invalidFiles.push({
          name: originalFile.file.name,
          contentType: result.payload.contentType,
          reason: 'Invalid file type',
        })
      }
    })

    // Step 2: Upload files to R2 using presigned URLs
    await this.uploadToR2(batch, inquiryUploadUrls)

    // Step 3: Confirm uploads with the server
    const mergedFileInformations = inquiryUploadUrls
      .filter(info => info.isDuplicate === false && info.isInvalid === false)
      .map((info) => {
        const originalIndex = inquiryUploadUrls.indexOf(info)
        return {
          extension: batch[originalIndex]?.file.name.split('.').pop() || '',
          ...info.payload,
          capturedAt: batch[originalIndex]?.capturedAt,
        }
      })

    let uploadedMedia: UploadedMedia[] = []
    if (mergedFileInformations.length > 0) {
      try {
        const response = await $fetch(`/api/events/single/${eventId}/upload`, {
          method: 'POST',
          body: {
            filesInformations: mergedFileInformations,
          },
        })
        uploadedMedia = response as UploadedMedia[]
      }
      catch (error) {
        console.error('Failed to confirm uploads:', error)
        uploadedMedia = []
      }
    }

    return {
      uploadedMedia,
      duplicateMedia,
      invalidFiles,
    }
  }

  private async uploadToR2(batch: FileProcessingResult[], inquiryUploadUrls: InquirePayload[]) {
    for (let i = 0; i < batch.length; i++) {
      const file = batch[i]?.file
      const uploadData = inquiryUploadUrls[i]

      if (uploadData?.isDuplicate) {
        console.warn(`File ${file?.name} is a duplicate, skipping upload.`)
        continue
      }

      if (uploadData?.isInvalid) {
        console.warn(`File ${file?.name} is invalid, skipping upload. Verify extension and content type. Type: ${file?.type}`)
      }

      if (file && uploadData && 'url' in uploadData && typeof file.content === 'string') {
        // Convert string content to ArrayBuffer for upload
        const response = await fetch(file.content) // file.content is a data URL
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Prepare upload promises for parallel execution
        const uploadPromises: Promise<unknown>[] = [
          $fetch(uploadData.url, {
            method: 'PUT',
            headers: uploadData.headers,
            body: uint8Array,
          }),
        ]

        // Add thumbnail upload if required
        if (uploadData.thumbnailUrl) {
          const thumbnailUploadPromise = FileProcessorService.generateThumbnail(uint8Array)
            .then(thumbnailBlob => $fetch(uploadData.thumbnailUrl!, {
              method: 'PUT',
              headers: uploadData.headers,
              body: thumbnailBlob,
            }))
          uploadPromises.push(thumbnailUploadPromise)
        }

        await Promise.all(uploadPromises)
      }
    }
  }
}

export class UploadStrategyService {
  static getStrategy(bucketType: EventBucketType): ClientUploadStrategy {
    switch (bucketType) {
      case 'filesystem':
        return new FilesystemUploadStrategy()
      case 'R2':
        return new R2UploadStrategy()
      default:
        throw new Error(`Unsupported storage type: ${bucketType}`)
    }
  }
}
