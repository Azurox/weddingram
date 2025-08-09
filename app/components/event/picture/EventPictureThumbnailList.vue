<template>
  <div class="relative">
    <template v-if="thumbnails?.pictures.length === 0">
      <UiContainer>
        <NuxtLink :to="`/event/${uuid}/upload`" class="p-10 mx-5 mt-10 block bg-white border border-dashed border-almond-500 text-neutral-600 text-center rounded-lg">
          Be the first to upload a picture and share the moment ✨
        </NuxtLink>
      </UiContainer>
    </template>
    <template v-else>
      <div class="sticky top-0 z-10 bg-almond-50  px-2 py-3  border-b border-b-almond-700/20">
        <UiContainer class="flex items-center gap-4">
          <label for="sort-by" class="font-logo tracking-wider font-medium">Sort by:</label>
          <select id="sort-by" v-model="selectedSortby" class="bg-white border border-almond-200 rounded-lg p-2 text-sm font-medium text-almond-700">
            <option value="recent">Recently uploaded</option>
            <option value="startOfWedding">Start of Wedding</option>
            <option value="endOfWedding">End of Wedding</option>
          </select>
        </UiContainer>
      </div>
      <UiContainer class="grid grid-cols-3 gap">
        <event-picture-thumbnail v-for="thumbnail in thumbnails?.pictures" :key="thumbnail.id" :picture="thumbnail" />
      </UiContainer>
    </template>
  </div>
</template>

<script lang="ts" setup>
const { uuid } = useRoute().params as { uuid: string };
type AvailableSortby = 'recent' | 'startOfWedding' | 'endOfWedding'

const selectedSortby = ref<AvailableSortby>('recent')
const currentPage = ref(1)

const sortByMapping = computed(() => {
  switch (selectedSortby.value) {
    case 'recent': return { sort: 'createdAt', direction: 'desc' }
    case 'startOfWedding': return { sort: 'capturedAt', direction: 'asc' }
    case 'endOfWedding': return { sort: 'capturedAt', direction: 'desc' }
    default: return { sort: 'createdAt', direction: 'desc' }
  }
})

const {
  data: thumbnails,
} = await useFetch(`/api/events/single/${uuid}/pictures`, {
  method: 'GET',
  params: {
    page: currentPage.value,
    sort: sortByMapping.value.sort,
    direction: sortByMapping.value.direction,
  },

})


</script>

<style></style>