import type { FileProcessingResult } from './FileProcessorService'
import type { BatchUploadResult, ClientUploadStrategy } from './UploadStrategyService'

export interface BatchUploadOptions {
  batchSize?: number
  onBatchComplete?: (batchResult: BatchUploadResult, batchIndex: number) => void
  onBatchError?: (error: unknown, batchIndex: number) => void
}

export class BatchUploadService {
  static async uploadInBatches(
    processedFiles: FileProcessingResult[],
    eventId: string,
    strategy: ClientUploadStrategy,
    options: BatchUploadOptions,
  ): Promise<BatchUploadResult> {
    const { batchSize = 5, onBatchComplete, onBatchError } = options

    const finalResult: BatchUploadResult = {
      uploadedMedia: [],
      duplicateMedia: [],
      invalidFiles: [],
    }

    for (let i = 0; i < processedFiles.length; i += batchSize) {
      const batch = processedFiles.slice(i, i + batchSize)
      const batchIndex = Math.floor(i / batchSize)

      try {
        const batchResult = await strategy.upload(batch, eventId)

        finalResult.uploadedMedia.push(...batchResult.uploadedMedia)
        finalResult.duplicateMedia.push(...batchResult.duplicateMedia)
        finalResult.invalidFiles.push(...batchResult.invalidFiles)

        if (onBatchComplete) {
          onBatchComplete(batchResult, batchIndex)
        }
      }
      catch (error) {
        console.error(`Error uploading batch ${batchIndex}:`, error)

        if (onBatchError) {
          onBatchError(error, batchIndex)
        }
        else {
          throw error
        }
      }
    }

    return finalResult
  }
}
