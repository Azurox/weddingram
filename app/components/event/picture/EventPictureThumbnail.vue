<template>
  <div class="relative">
    <img :src="picture.url" class="w-full aspect-square object-cover">
    <ClientOnly>
      <button class="absolute right-2 bottom-2 group transition-transform active:scale-95" :aria-pressed="isInFavorite" @click="toggleFavorite" type="button">
        <svg class="size-7 text-white/30 stroke-1 stroke-almond-300 transition-colors group-aria-[pressed=true]:text-almond-300" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Google Material Icons by Material Design Authors - https://github.com/material-icons/material-icons/blob/master/LICENSE --><path fill="currentColor" d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>
      </button>
    </ClientOnly>
    
  </div>
</template>

<script lang="ts" setup>
import type { SerializeObject } from 'nitropack'
import { useStorage } from '@vueuse/core'
import type { UploadedPicture } from '~~/server/api/events/single/[id]/pictures/index.get';

const {picture} = defineProps<{
  picture: SerializeObject<UploadedPicture>
}>()

const favorites = useStorage<Record<string, true>>('favorites', {})
const { data: fetchedFavorites } = useNuxtData<SerializeObject<UploadedPicture>[]>('favorites')

const isInFavorite = computed(() => {
  return !!favorites.value[picture.id] || fetchedFavorites.value?.some(favorite => favorite.id === picture.id)
})

function toggleFavorite() {
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
