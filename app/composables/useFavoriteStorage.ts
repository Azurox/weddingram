import { useStorage } from '@vueuse/core'

export const useFavoriteStorage = () => {
  const route = useRoute();
  const uuid = computed(() => route.params.uuid as string);
  const storageKey = computed(() => `favorites_${uuid.value}`);
  const favorites = useStorage<Record<string, boolean>>(storageKey, {})

  function toggleFavorite(pictureId: string) {
    if (favorites.value[pictureId]) {
      favorites.value[pictureId] = false
    } else {
      favorites.value[pictureId] = true
    }
  }

  function removeFavorite(pictureId: string) {
    if(favorites.value[pictureId] ) {
      favorites.value[pictureId] = false
    }
  }

  function isInFavorite(pictureId: string): boolean {
    return !!favorites.value[pictureId]
  }

  return {
    favorites,
    toggleFavorite,
    removeFavorite,
    isInFavorite,
  }
}
