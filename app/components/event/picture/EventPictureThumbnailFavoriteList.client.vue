<template>
  <div v-if="thumbnails" class="grid grid-cols-3">
    <event-picture-thumbnail
      v-for="thumbnail in thumbnails"
      :key="thumbnail.id"
      :picture="thumbnail"
    />
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'

const { uuid } = useRoute().params as { uuid: string };
const favorites = useStorage<Record<string, true>>('favorites', {})

const { data: thumbnails} = await useFetch(`/api/events/${uuid}/pictures/batch`, {
    method: 'get',
    body: {
      pictureIds: Object.keys(favorites.value)
    },
    key: 'favorites'
  })
</script>
