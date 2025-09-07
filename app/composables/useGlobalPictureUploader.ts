import type { ClientFile } from 'nuxt-file-storage'
import type { EventBucketType } from '~~/server/database/schema/event-schema'
import type { UploadResultDetails } from './state/useUploadState'
import type { ClientUploadStrategy, FileProgressCapable } from '~/services/UploadStrategyService'
import { BatchUploadService } from '~/services/BatchUploadService'
import { FileProcessorService } from '~/services/FileProcessorService'
import { ToastService } from '~/services/ToastService'
import { UploadStrategyService } from '~/services/UploadStrategyService'
import { useUploadState } from './state/useUploadState'

export function useGlobalPictureUploader() {
  const { addUploadedPictures } = useUploadedPictureStorage()

  const uploadState = useUploadState()
  const { isSupported, request, release } = useWakeLock()

  const route = useRoute()
  const eventId = computed(() => route.params.uuid as string)

  async function uploadPictures(files: ClientFile[], bucketType: EventBucketType) {
    uploadState.start(files.length)

    try {
      if (isSupported) {
        await request('screen')
      }

      const strategy = UploadStrategyService.getStrategy(bucketType)

      // Set up progress callback for strategies that support file progress
      if (strategy.supportsFileProgress && 'setProgressCallback' in strategy) {
        const progressCapableStrategy = strategy as ClientUploadStrategy & FileProgressCapable
        progressCapableStrategy.setProgressCallback((fileName: string, percentage: number, uploadedBytes: number, totalBytes: number) => {
          uploadState.setFileUploadProgress(fileName, percentage, uploadedBytes, totalBytes)

          // When file completes (100%), increment the batch progress and clear file progress
          if (percentage >= 100) {
            uploadState.incrementProgress(1)
            uploadState.clearFileUploadProgress()
          }
        })
      }

      const processedFiles = await FileProcessorService.processFiles(files)

      const result = await BatchUploadService.uploadInBatches(
        processedFiles,
        eventId.value,
        strategy,
        {
          batchSize: 5,
          onBatchComplete: (batchResult, _batchIndex) => {
            // Add only the uploaded media to storage
            addUploadedPictures(batchResult.uploadedMedia)
            // Note: Progress is now incremented per file in the progress callback, not per batch
          },
          onBatchError: (error: unknown, batchIndex) => {
            console.error(`Batch ${batchIndex} failed:`, error)
            useToast().error({
              title: 'Upload Error',
              message: `Some pictures may not have been uploaded. Please try again by uploading less pictures.`,
              ...ToastService.getPresetForError(),
            })
            // Continue with other batches instead of failing completely
          },
        },
      )

      // Convert the result to the format expected by the UI

      const uploadResultDetails: UploadResultDetails = {
        successCount: result.uploadedMedia.length,
        duplicateFiles: result.duplicateMedia.map(dup => ({
          name: dup.name ?? 'Unknown',
          hash: dup.hash,
          file: dup.file ?? '',
          contentType: dup.contentType ?? 'application/octet-stream',
        })),
        invalidFiles: result.invalidFiles.map(invalid => ({
          name: invalid.name ?? 'Unknown',
          contentType: invalid.contentType ?? 'application/octet-stream',
          reason: invalid.reason,
        })),
      }

      uploadState.setUploadResult(uploadResultDetails)
      uploadState.complete()
    }
    catch (error: unknown) {
      console.error('Failed to upload pictures:', error)

      useToast().error({
        title: 'Upload Error',
        message: `Some pictures may not have been uploaded. Please try again by uploading less pictures.`,
        ...ToastService.getPresetForError(),
      })

      uploadState.setError(error instanceof Error ? error : new Error('Unknown upload error'))
    }
    finally {
      if (isSupported) {
        await release()
      }
    }
  }

  return {
    isLoading: uploadState.isLoading,
    progress: uploadState.progress,
    isUploadCompleted: uploadState.isUploadCompleted,
    latestUploadResult: uploadState.latestUploadResult,
    error: uploadState.error,
    currentFileBeingUploaded: uploadState.fileUploadProgress,

    uploadPictures,
    reset: uploadState.reset,
  }
}
