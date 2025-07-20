<template>
  <div class="relative">
    <img :src="picture.url" class="w-full aspect-square">
    <ClientOnly>
      <span v-if="isInFavorite" class="absolute right-0 bottom-0">F</span>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import type { UploadedPicture } from '~~/server/api/events/[id]/pictures/index.get';
import type { SerializeObject } from 'nitropack'
import { useStorage } from '@vueuse/core'

const {picture} = defineProps<{
  picture: SerializeObject<UploadedPicture>
}>()

const favorites = useStorage<Record<string, true>>('favorites', {})
const { data: fetchedFavorites } = useNuxtData<SerializeObject<UploadedPicture>[]>('favorites')

const isInFavorite = computed(() => {
  return !!favorites.value[picture.id] || fetchedFavorites.value?.some(favorite => favorite.id === picture.id)
})

function _toggleFavorite(picture: SerializeObject<UploadedPicture>) {
  if(fetchedFavorites.value) {

    if (fetchedFavorites.value.find(favorite => favorite.id === picture.id)) {
      fetchedFavorites.value = fetchedFavorites.value.filter(favorite => favorite.id === picture.id)
    } else {
      fetchedFavorites.value.push(picture)
    }
  }

  if (favorites.value[picture.id]) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete favorites.value[picture.id]
  } else {
    favorites.value[picture.id] = true
  }
}

</script>
