import type { InquirePayload } from '~~/server/api/events/single/[id]/inquire-upload.post'
import type { EventBucketType } from '~~/server/database/schema/event-schema'
import type { FileProcessingResult } from './FileProcessorService'
import { FileProcessorService } from './FileProcessorService'

export interface UploadResult {
  id: string
  url: string
  deleteId: string
  thumbnailUrl: string | null
  isVideo: boolean
}

export interface ClientUploadStrategy {
  upload: (batch: FileProcessingResult[], eventId: string) => Promise<UploadResult[]>
}

export class FilesystemUploadStrategy implements ClientUploadStrategy {
  async upload(batch: FileProcessingResult[], eventId: string): Promise<UploadResult[]> {
    const filesInformations = batch.map(item => ({
      hash: item.hash,
      capturedAt: item.capturedAt,
    }))

    return await $fetch(`/api/events/single/${eventId}/upload`, {
      method: 'POST',
      body: {
        files: batch.map(item => item.file),
        filesInformations,
      },
    })
  }
}

export class R2UploadStrategy implements ClientUploadStrategy {
  async upload(batch: FileProcessingResult[], eventId: string): Promise<UploadResult[]> {
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

    // Step 2: Upload files to R2 using presigned URLs
    await this.uploadToR2(batch, inquiryUploadUrls)

    // Step 3: Confirm uploads with the server
    const mergedFileInformations = inquiryUploadUrls
      .filter(info => !info.isDuplicate)
      .map((info) => {
        const originalIndex = inquiryUploadUrls.indexOf(info)
        return {
          extension: batch[originalIndex]?.file.name.split('.').pop() || '',
          ...info.payload,
          capturedAt: batch[originalIndex]?.capturedAt,
        }
      })

    return await $fetch(`/api/events/single/${eventId}/upload`, {
      method: 'POST',
      body: {
        filesInformations: mergedFileInformations,
      },
    })
  }

  private async uploadToR2(batch: FileProcessingResult[], inquiryUploadUrls: InquirePayload[]) {
    for (let i = 0; i < batch.length; i++) {
      const file = batch[i]?.file
      const uploadData = inquiryUploadUrls[i]

      if (uploadData?.isDuplicate) {
        console.warn(`File ${file?.name} is a duplicate, skipping upload.`)
        continue
      }

      if (file && uploadData && 'url' in uploadData && typeof file.content === 'string') {
        // Convert string content to ArrayBuffer for upload
        const response = await fetch(file.content) // file.content is a data URL
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        let thumbnailPromise: Promise<unknown> | undefined

        if (uploadData.thumbnailUrl) {
          const thumbnailBlob = await FileProcessorService.generateThumbnail(uint8Array)
          thumbnailPromise = $fetch(uploadData.thumbnailUrl, {
            method: 'PUT',
            headers: uploadData.headers,
            body: thumbnailBlob,
          })
        }

        await Promise.all([$fetch(uploadData.url, {
          method: 'PUT',
          headers: uploadData.headers,
          body: uint8Array,
        }), thumbnailPromise])
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
