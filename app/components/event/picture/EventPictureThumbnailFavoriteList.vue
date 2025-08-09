<template>
  <UiContainer v-if="picturesData && picturesData.length > 0" class="grid grid-cols-3">
    <event-picture-thumbnail
      v-for="picture in picturesData"
      :key="picture.id"
      :picture="picture"
      :display-favorite-toggle="false"
    />
  </UiContainer>
  <div v-else class=" px-2 py-3 text-sm text-neutral-600">
    <UiContainer>
      Start saving picture by clicking on the heart icon...
    </UiContainer>
  </div>
</template>

<script lang="ts" setup>
import UiContainer from '~/components/ui/UiContainer.vue';

const { uuid } = useRoute().params as { uuid: string };
const { favorites } = useFavoriteStorage()

const { data: picturesData, execute: fetchPictures } = await useFetch(`/api/events/single/${uuid}/pictures/batch`, {
    method: 'get',
    params: {
      pictureIds: Object.entries(favorites.value)
        .filter(([_, isFavorite]) => isFavorite)
        .map(([id]) => id),
    },
    key: 'favorites',
    immediate: false,
})


watch(favorites, async () => {
  if (Object.keys(favorites.value).length > 0) {
    console.log('Fetching favorite pictures...')
    console.log('Favorite picture IDs:', Object.entries(favorites.value).filter(([_, isFavorite]) => isFavorite).map(([id]) => id))
    await fetchPictures()
  }
}, { deep: true, immediate: true })

</script>
