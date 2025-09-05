import type { ClientFile } from 'nuxt-file-storage'
import type { EventBucketType } from '~~/server/database/schema/event-schema'
import type { UploadResultDetails } from './state/useUploadState'
import { BatchUploadService } from '~/services/BatchUploadService'
import { FileProcessorService } from '~/services/FileProcessorService'
import { ToastService } from '~/services/ToastService'
import { UploadStrategyService } from '~/services/UploadStrategyService'
import { useUploadState } from './state/useUploadState'

export function useGlobalPictureUploader() {
  const { addUploadedPictures } = useUploadedPictureStorage()

  const uploadState = useUploadState()

  const route = useRoute()
  const eventId = computed(() => route.params.uuid as string)

  async function uploadPictures(files: ClientFile[], bucketType: EventBucketType) {
    uploadState.start(files.length)

    try {
      const strategy = UploadStrategyService.getStrategy(bucketType)
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
            uploadState.incrementProgress(batchResult.uploadedMedia.length)
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
          name: dup.name,
          hash: dup.hash,
          file: dup.file,
          contentType: dup.contentType,
        })),
        invalidFiles: result.invalidFiles.map(invalid => ({
          name: invalid.name,
          contentType: invalid.contentType,
          reason: invalid.reason,
        })),
      }

      // Set the detailed upload results only if we have useful information to show
      if (uploadResultDetails.duplicateFiles.length > 0 || uploadResultDetails.invalidFiles.length > 0) {
        uploadState.setUploadResult(uploadResultDetails)
      }

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
  }

  return {
    isLoading: uploadState.isLoading,
    progress: uploadState.progress,
    isUploadCompleted: uploadState.isUploadCompleted,
    latestUploadResult: uploadState.latestUploadResult,
    error: uploadState.error,

    uploadPictures,
    reset: uploadState.reset,
  }
}
