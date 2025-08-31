import type { ClientFile } from 'nuxt-file-storage'
import type { EventBucketType } from '~~/server/database/schema/event-schema'
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

      await BatchUploadService.uploadInBatches(
        processedFiles,
        eventId.value,
        strategy,
        {
          batchSize: 5,
          onBatchComplete: (results) => {
            addUploadedPictures(results)
            uploadState.incrementProgress(results.length)
          },
          onBatchError: (error, batchIndex) => {
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

      uploadState.complete()
    }
    catch (error) {
      console.error('Failed to upload pictures:', error)

      useToast().error({
        title: 'Upload Error',
        message: `Some pictures may not have been uploaded. Please try again by uploading less pictures.`,
        ...ToastService.getPresetForError(),
      })

      uploadState.setError(error as Error)
    }
  }

  return {
    isLoading: uploadState.isLoading,
    progress: uploadState.progress,
    isUploadCompleted: uploadState.isUploadCompleted,
    error: uploadState.error,

    uploadPictures,
    reset: uploadState.reset,
  }
}
