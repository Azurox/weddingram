export function usePictureDelete() {
  const route = useRoute()
  const uuid = computed(() => route.params.uuid as string)
  const { removeUploadedPictures } = useUploadedPictureStorage()

  const isDeleting = ref(false)

  async function deletePicturesByMagicIds(magicDeleteIds: string[]) {
    if (magicDeleteIds.length === 0)
      return

    isDeleting.value = true

    try {
      const result = await $fetch<{ success: boolean, deletedCount: number, deletedIds: string[] }>(
        `/api/events/single/${uuid.value}/pictures/magic-delete`,
        {
          method: 'DELETE',
          body: {
            magicDeleteIds,
          },
        },
      )

      if (result.success) {
        // Remove from local storage
        removeUploadedPictures(result.deletedIds)
        return result
      }
    }
    catch (error) {
      console.error('Failed to delete pictures:', error)
      throw error
    }
    finally {
      isDeleting.value = false
    }
  }

  return {
    isDeleting,
    deletePicturesByMagicIds,
  }
}
