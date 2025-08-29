import type { ClientFile } from 'nuxt-file-storage'
import type { EventBucketType } from '~~/server/database/schema/event-schema'
import ExifReader from 'exifreader'

interface FileComplementaryInformations {
  hash: string
  capturedAt: Date
}

export function useGlobalPictureUploader() {
  const isLoading = useState('isLoading', () => false)
  const progress = useState<{ current: number, total: number } | null>('uploadProgress', () => null)
  const isUploadCompleted = useState('isUploadCompleted', () => false)
  const route = useRoute()
  const uuid = computed(() => route.params.uuid as string)
  const { addUploadedPictures } = useUploadedPictureStorage()

  // Helper function to calculate SHA-256 hash of a file
  async function calculateFileHash(file: ClientFile): Promise<string> {
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

  async function extractExifData(file: ClientFile) {
    try {
      const tags = await ExifReader.load(file.content as string)

      let capturedAt = new Date()
      if (tags.DateTimeOriginal) {
        const [year, month, date, hour, min, sec] = tags.DateTimeOriginal.description.split(/\D/)
        capturedAt = new Date(Number(year), Number(month) - 1, Number(date), Number(hour), Number(min), Number(sec))
      }

      return {
        capturedAt,
      }
    }
    catch (error) {
      console.error('Error extracting EXIF data:', error)
      return {
        capturedAt: new Date(), // Fallback to current date if EXIF data extraction fails
      }
    }
  }

  async function uploadFilesystemBatch(files: ClientFile[], filesInformations: FileComplementaryInformations[]) {
    return await $fetch(`/api/events/single/${uuid.value}/upload`, {
      method: 'POST',
      body: {
        files,
        filesInformations,
      },
    })
  }

  async function uploadR2Batch(files: ClientFile[], filesInformations: FileComplementaryInformations[]) {
    const inquiryInformations = filesInformations.map((info, index) => {
      if (files[index]) {
        return {
          hash: info.hash,
          extension: files[index].name.split('.').pop() || '',
          contentType: files[index].type,
          length: Number(files[index].size),
        }
      }
      else {
        throw new Error(`File at index ${index} is undefined`)
      }
    })

    const inquiryUploadUrls = await $fetch(`/api/events/single/${uuid.value}/inquire-upload`, {
      method: 'POST',
      body: inquiryInformations,
    })

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadData = inquiryUploadUrls[i]

      if (uploadData?.isDuplicate) {
        console.warn(`File ${file?.name} is a duplicate, skipping upload.`)
        continue
      }

      if (file && uploadData && 'url' in uploadData && typeof file.content === 'string') {
        const response = await fetch(file.content)
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        await $fetch(uploadData.url, {
          method: 'PUT',
          headers: uploadData.headers,
          body: uint8Array,
        })
      }
    }

    if (inquiryUploadUrls.length !== files.length) {
      console.error('Mismatch between inquiryUploadUrls and files lengths:', inquiryUploadUrls.length, files.length)
      throw new Error('The number of inquiry upload URLs does not match the number of files. Please check your input.')
    }

    const mergedFileFilesInformations = inquiryUploadUrls.map((info, index) => {
      return {
        extension: files[index]?.name.split('.').pop() || '',
        contentType: info.payload.contentType,
        length: info.payload.length,
        id: info.payload.id,
        filename: info.payload.filename,
        hash: info.payload.hash,
        capturedAt: filesInformations[index]?.capturedAt,
        isDuplicate: info.isDuplicate,
      }
    })

    const result = await $fetch(`/api/events/single/${uuid.value}/upload`, {
      method: 'POST',
      body: {
        filesInformations: mergedFileFilesInformations.filter(fi => !fi.isDuplicate).map(({ isDuplicate, ...rest }) => rest),
      },
    })

    return result
  }

  async function uploadPictures(files: ClientFile[], uploadTarget: EventBucketType) {
    isLoading.value = true
    isUploadCompleted.value = false

    progress.value = { current: 0, total: files.length }
    try {
      const batchSize = 5

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)
        const _batchNumber = Math.floor(i / batchSize) + 1

        // Calculate hash for each file in the batch
        const filesInformations: { hash: string, capturedAt: Date }[] = []
        for (const file of batch) {
          const hash = await calculateFileHash(file)
          const { capturedAt } = await extractExifData(file)
          filesInformations.push({ hash, capturedAt })
        }

        if (uploadTarget === 'filesystem') {
          // Upload the batch
          const result = await uploadFilesystemBatch(batch, filesInformations)

          // Save uploaded pictures to storage
          if (result && result.length > 0) {
            addUploadedPictures(result)
          }

          progress.value.current += batch.length
        }
        else {
          const result = await uploadR2Batch(batch, filesInformations)

          // Save uploaded pictures to storage
          if (result && result.length > 0) {
            addUploadedPictures(result)
          }

          progress.value.current += batch.length
        }
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
