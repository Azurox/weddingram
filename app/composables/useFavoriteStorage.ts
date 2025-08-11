import { useStorage } from '@vueuse/core'

export const useFavoriteStorage = () => {
  const favorites = useStorage<Record<string, boolean>>('favorites', {})

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
