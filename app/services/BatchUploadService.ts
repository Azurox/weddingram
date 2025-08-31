import type { FileProcessingResult } from './FileProcessorService'
import type { ClientUploadStrategy, UploadResult } from './UploadStrategyService'

export interface BatchUploadOptions {
  batchSize: number
  onBatchComplete: (results: UploadResult[]) => void
  onBatchError?: (error: Error, batchIndex: number) => void
}

export class BatchUploadService {
  static async uploadInBatches(
    processedFiles: FileProcessingResult[],
    eventId: string,
    strategy: ClientUploadStrategy,
    options: BatchUploadOptions,
  ) {
    const { batchSize, onBatchComplete, onBatchError } = options

    for (let i = 0; i < processedFiles.length; i += batchSize) {
      const batch = processedFiles.slice(i, i + batchSize)
      const batchIndex = Math.floor(i / batchSize)

      try {
        const results = await strategy.upload(batch, eventId)

        if (results?.length > 0) {
          onBatchComplete(results)
        }
      }
      catch (error) {
        console.error(`Error uploading batch ${batchIndex}:`, error)

        if (onBatchError) {
          onBatchError(error as Error, batchIndex)
        }
        else {
          throw error
        }
      }
    }
  }
}
