import type { InquirePayload } from '~~/server/api/events/single/[id]/inquire-upload.post'
import type { EventBucketType } from '~~/server/database/schema/event-schema'
import type { BatchUploadResult, DuplicateMedia, InvalidFile, UploadedMedia } from '~~/shared/types/BatchUploadResult'
import type { FileProcessingResult } from './FileProcessorService'
import { FetchError } from 'ofetch'
import { FileProcessorService } from './FileProcessorService'

export interface ClientUploadStrategy {
  upload: (batch: FileProcessingResult[], eventId: string) => Promise<BatchUploadResult>
  readonly supportsFileProgress: boolean
}

export interface UploadProgressCallback {
  (fileName: string, percentage: number, uploadedBytes: number, totalBytes: number): void
}

export interface FileProgressCapable {
  setProgressCallback: (callback: UploadProgressCallback) => void
}

export class FilesystemUploadStrategy implements ClientUploadStrategy {
  readonly supportsFileProgress = false

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
      const batchResult = await $fetch(`/api/events/single/${eventId}/upload`, {
        method: 'POST',
        body: {
          files: batch.map(item => item.file),
          filesInformations,
        },
      })

      return batchResult
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

      errorPayload.duplicates.forEach((dup: { hash: string }) => {
        const file = batch.find(f => f.hash === dup.hash)

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
            hash: invalid.hash,
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

export class R2UploadStrategy implements ClientUploadStrategy, FileProgressCapable {
  readonly supportsFileProgress = true
  private onUploadProgress?: UploadProgressCallback
  private currentFileName: string | null = null
  private completedFiles = new Set<string>()

  setProgressCallback(callback: UploadProgressCallback) {
    this.onUploadProgress = callback
  }

  resetProgressTracking() {
    this.currentFileName = null
    this.completedFiles.clear()
  }

  async upload(batch: FileProcessingResult[], eventId: string): Promise<BatchUploadResult> {
    // Reset progress tracking for new batch
    this.resetProgressTracking()

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
          hash: result.payload.hash,
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
        uploadedMedia = response.uploadedMedia
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
        continue
      }

      if (file && uploadData && 'url' in uploadData && typeof file.content === 'string') {
        // Fast conversion from base64 to binary
        const base64Data = file.content.split(',')[1]
        if (!base64Data) {
          throw new Error(`Invalid data URL for file: ${file.name}`)
        }
        const binaryString = atob(base64Data)
        const uint8Array = new Uint8Array(binaryString.length)
        for (let j = 0; j < binaryString.length; j++) {
          uint8Array[j] = binaryString.charCodeAt(j)
        }

        // Upload main file with progress tracking
        await this.uploadWithStreamProgress(uploadData.url, uint8Array, uploadData.headers, file.name)

        // Handle thumbnail upload separately (without progress tracking for thumbnails)
        if (uploadData.thumbnailUrl && !file.type.startsWith('video/')) {
          const thumbnailBlob = await FileProcessorService.generateThumbnail(uint8Array)
          await $fetch(uploadData.thumbnailUrl, {
            method: 'PUT',
            headers: uploadData.headers,
            body: thumbnailBlob,
          })
        }
      }
    }
  }

  private uploadWithStreamProgress = async (url: string, data: Uint8Array, headers: Record<string, string>, fileName: string): Promise<void> => {
    const totalSize = data.length

    // Use XMLHttpRequest for reliable progress tracking with presigned URLs
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100

          // Reset progress to 0 when starting a new file
          if (this.currentFileName !== fileName) {
            this.currentFileName = fileName
            this.onUploadProgress?.(fileName, 0, 0, event.total)
          }

          this.onUploadProgress?.(fileName, percentComplete, event.loaded, event.total)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Ensure we report 100% completion and mark file as completed
          if (!this.completedFiles.has(fileName)) {
            this.completedFiles.add(fileName)
            this.onUploadProgress?.(fileName, 100, totalSize, totalSize)
          }
          this.currentFileName = null
          resolve()
        }
        else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error(`Upload failed for ${fileName}`))
      })

      xhr.open('PUT', url)

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.send(data as unknown as ArrayBuffer) // Send as ArrayBuffer
    })
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
