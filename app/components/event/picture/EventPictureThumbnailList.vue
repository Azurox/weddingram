<template>
  <div>
    <template v-if="thumbnails?.pictures.length === 0">
      <NuxtLink :to="`/event/${uuid}/upload`" class="p-10 mx-5 mt-10 block bg-white border border-dashed border-almond-500 text-neutral-600 text-center rounded-lg">
        Be the first to upload a picture and share the moment ✨
      </NuxtLink>
    </template>
    <div v-else class="grid grid-cols-3 gap">
      <event-picture-thumbnail v-for="thumbnail in thumbnails?.pictures" :key="thumbnail.id" :picture="thumbnail" />
    </div>
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