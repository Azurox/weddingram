export interface ProgressState {
  current: number
  total: number
}

export interface FileUploadProgress {
  fileName: string
  percentage: number
  uploadedBytes: number
  totalBytes: number
}

export interface UploadResultDetails {
  successCount: number
  duplicateFiles: Array<{ name: string, hash: string, file: string, contentType: string }>
  invalidFiles: Array<{ name: string, contentType: string, reason: string }>
}

export function useUploadState() {
  const isLoading = useState('uploadState:isLoading', () => false)
  const progress = useState<ProgressState | null>('uploadState:progress', () => null)
  const fileUploadProgress = useState<FileUploadProgress | null>('uploadState:fileProgress', () => null)
  const isUploadCompleted = useState('uploadState:isCompleted', () => false)
  const error = useState<Error | null>('uploadState:error', () => null)
  const latestUploadResult = useState<UploadResultDetails | null>('uploadState:latestResult', () => null)

  function start(totalFiles: number) {
    isLoading.value = true
    isUploadCompleted.value = false
    error.value = null
    latestUploadResult.value = null
    progress.value = { current: 0, total: totalFiles }
  }

  function incrementProgress(count: number) {
    if (progress.value) {
      progress.value.current += count
    }
  }

  function setFileUploadProgress(fileName: string, percentage: number, uploadedBytes: number, totalBytes: number) {
    fileUploadProgress.value = {
      fileName,
      percentage,
      uploadedBytes,
      totalBytes,
    }
  }

  function clearFileUploadProgress() {
    fileUploadProgress.value = null
  }

  function complete() {
    isLoading.value = false
    isUploadCompleted.value = true
  }

  function setError(err: Error) {
    isLoading.value = false
    error.value = err
  }

  function setUploadResult(result: UploadResultDetails) {
    latestUploadResult.value = result
  }

  function reset() {
    isLoading.value = false
    isUploadCompleted.value = false
    error.value = null
    progress.value = null
    fileUploadProgress.value = null
    latestUploadResult.value = null
  }

  return {
    // State
    isLoading: readonly(isLoading),
    progress: readonly(progress),
    fileUploadProgress: readonly(fileUploadProgress),
    error: readonly(error),
    isUploadCompleted,
    latestUploadResult: readonly(latestUploadResult),

    // Actions
    start,
    incrementProgress,
    setFileUploadProgress,
    clearFileUploadProgress,
    complete,
    setError,
    setUploadResult,
    reset,
  }
}
