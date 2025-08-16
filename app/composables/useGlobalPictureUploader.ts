export function useGlobalPictureUploader() {
  const isLoading = useState('isLoading', () => false)
  const progress = useState<{ current: number, total: number } | null>('uploadProgress', () => null)
  const isUploadCompleted = useState('isUploadCompleted', () => false)
  const route = useRoute()
  const uuid = computed(() => route.params.uuid as string)
  const { addUploadedPictures } = useUploadedPictureStorage()

  // We actually don't use the composable, only for the typing. A cleaner way to do it would be appreciated :)
  const { files: _filesType } = useFileStorage()
  type FilesType = typeof _filesType.value
  // Helper function to calculate SHA-256 hash of a file
  async function calculateFileHash(file: FilesType[0]): Promise<string> {
    if (!file.content) {
      throw new Error('File content is not available')
    }
    if (typeof file.content !== 'string') {
      throw new TypeError('File content is not a string')
    }
    // Convert string content to ArrayBuffer
    const encoder = new TextEncoder()
    const arrayBuffer = encoder.encode(file.content).buffer
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  async function uploadBatch(files: FilesType, filesInformations: { hash: string }[]) {
    const result = await $fetch(`/api/events/single/${uuid.value}/upload`, {
      method: 'POST',
      body: {
        files,
        filesInformations,
      },
    })
    return result
  }

  async function uploadPictures(files: FilesType) {
    isLoading.value = true
    isUploadCompleted.value = false

    progress.value = { current: 0, total: files.length }
    try {
      const batchSize = 5

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)
        const _batchNumber = Math.floor(i / batchSize) + 1

        // Calculate hash for each file in the batch
        const filesInformations: { hash: string }[] = []
        for (const file of batch) {
          const hash = await calculateFileHash(file)
          filesInformations.push({ hash })
        }

        // Upload the batch
        const result = await uploadBatch(batch, filesInformations)

        // Save uploaded pictures to storage
        if (result && result.length > 0) {
          addUploadedPictures(result)
        }

        progress.value.current += batch.length
      }

      isUploadCompleted.value = true
    }
    catch (error) {
      console.error('Failed to upload pictures:', error)
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    progress,
    isUploadCompleted,
    uploadPictures,
    calculateFileHash,
  }
}
