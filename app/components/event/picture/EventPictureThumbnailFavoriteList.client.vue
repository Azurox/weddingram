
<template>
  <div class="relative">
    <template v-if="favoritePictureList?.length === 0 && !pending">
      <UiContainer>
        <span class="p-10 mx-5 mt-10 block bg-white border border-dashed border-almond-500 text-neutral-600 text-center rounded-lg">
          Start saving picture favorites by clicking the heart icon on the right corner.
        </span>
      </UiContainer>
    </template>
    <template v-else>
      <UiContainer class="grid grid-cols-3 gap">
        <event-picture-thumbnail
          v-for="picture in favoritePictureList"
          :key="picture.id"
          :picture="picture"
          :display-favorite-toggle="false"
        />
      </UiContainer>
    </template>
  </div>
</template>

<script lang="ts" setup>

import { ref, computed, watch } from 'vue';
import { useInfiniteScroll } from '@vueuse/core';
import UiContainer from '~/components/ui/UiContainer.vue';
import type { UploadedPicture } from '~~/server/api/events/single/[id]/pictures/index.get';
import type { SerializeObject } from 'nitropack';

const PAGE_SIZE = 20;
const currentPage = ref(1);
const favoritePictureList = ref<SerializeObject<UploadedPicture>[]>([]);
const hasMore = ref(true);
const pending = ref(false);

const { uuid } = useRoute().params as { uuid: string };
const { favorites } = useFavoriteStorage();

const favoriteIds = computed(() =>
  Object.entries(favorites.value)
    .filter(([_, isFavorite]) => isFavorite)
    .map(([id]) => id)
);

async function fetchFavoritePictures(page: number) {
  if (favoriteIds.value.length === 0) {
    favoritePictureList.value = [];
    hasMore.value = false;
    return;
  }
  pending.value = true;
  const idsForPage = favoriteIds.value.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (idsForPage.length === 0) {
    hasMore.value = false;
    pending.value = false;
    return;
  }
  const { data } = await useFetch(`/api/events/single/${uuid}/pictures/batch`, {
    method: 'get',
    params: { pictureIds: idsForPage },
    key: `favorites-page-${page}`,
    immediate: true,
  });
  if (data.value && Array.isArray(data.value)) {
    // Clean up localStorage: remove IDs that weren't returned by the backend
    const returnedIds = data.value.map(picture => picture.id);
    const deletedIds = idsForPage.filter(id => !returnedIds.includes(id));
    
    if (deletedIds.length > 0) {
      const { removeFavorite } = useFavoriteStorage();
      deletedIds.forEach(id => removeFavorite(id));
    }
    
    if (page === 1) {
      favoritePictureList.value = data.value;
    } else {
      favoritePictureList.value = [...favoritePictureList.value, ...data.value];
    }
    // Check if we have more pages to load based on remaining favorite IDs
    const totalProcessedIds = page * PAGE_SIZE;
    hasMore.value = totalProcessedIds < favoriteIds.value.length;
  } else {
    hasMore.value = false;
  }
  pending.value = false;
}

watch(favorites, async () => {
  currentPage.value = 1;
  await fetchFavoritePictures(1);
}, { deep: true, immediate: true });

useInfiniteScroll(
  window,
  async () => {
    if (!pending.value && hasMore.value) {
      currentPage.value += 1;
      await fetchFavoritePictures(currentPage.value);
    }
  },
  {
    distance: 300,
    canLoadMore: () => hasMore.value && !pending.value,
  }
);
</script>
