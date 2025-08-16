import { useStorage } from '@vueuse/core'

export interface UploadedPicture {
  id: string
  url: string
  deleteId: string
}

export function useUploadedPictureStorage() {
  const route = useRoute()
  const uuid = computed(() => route.params.uuid as string)
  const storageKey = computed(() => `uploadedPictures_${uuid.value}`)

  const uploadedPictures = useStorage<UploadedPicture[]>(storageKey, [])

  function addUploadedPictures(newPictures: UploadedPicture[]) {
    uploadedPictures.value.push(...newPictures)
  }

  function removeUploadedPictures(deleteIds: string[]) {
    uploadedPictures.value = uploadedPictures.value.filter(
      picture => !deleteIds.includes(picture.deleteId),
    )
  }

  function clearUploadedPictures() {
    uploadedPictures.value = []
  }

  function getUploadedPictureByDeleteId(deleteId: string): UploadedPicture | undefined {
    return uploadedPictures.value.find(picture => picture.deleteId === deleteId)
  }

  return {
    uploadedPictures,
    addUploadedPictures,
    removeUploadedPictures,
    clearUploadedPictures,
    getUploadedPictureByDeleteId,
  }
}
