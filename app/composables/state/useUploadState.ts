export interface ProgressState {
  current: number
  total: number
}

export function useUploadState() {
  const isLoading = useState('uploadState:isLoading', () => false)
  const progress = useState<ProgressState | null>('uploadState:progress', () => null)
  const isUploadCompleted = useState('uploadState:isCompleted', () => false)
  const error = useState<Error | null>('uploadState:error', () => null)

  function start(totalFiles: number) {
    isLoading.value = true
    isUploadCompleted.value = false
    error.value = null
    progress.value = { current: 0, total: totalFiles }
  }

  function incrementProgress(count: number) {
    if (progress.value) {
      progress.value.current += count
    }
  }

  function complete() {
    isLoading.value = false
    isUploadCompleted.value = true
  }

  function setError(err: Error) {
    isLoading.value = false
    error.value = err
  }

  function reset() {
    isLoading.value = false
    isUploadCompleted.value = false
    error.value = null
    progress.value = null
  }

  return {
    // State
    isLoading: readonly(isLoading),
    progress: readonly(progress),
    error: readonly(error),
    isUploadCompleted,

    // Actions
    start,
    incrementProgress,
    complete,
    setError,
    reset,
  }
}
