<template>
  <div class="grid grid-cols-3">
    <event-picture-thumbnail
      v-for="thumbnail in thumbnails?.pictures"
      :key="thumbnail.id"
      :picture="thumbnail"
    />
  </div>
</template>

<script lang="ts" setup>
const { uuid } = useRoute().params as { uuid: string };
type AvailableSortby = 'recent' | 'startOfWedding' | 'endOfWedding'


const {
  data: thumbnails,
} = await useAsyncData(() => fetchSubmissions())
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

async function fetchSubmissions() {
  return $fetch(`/api/events/${uuid}/pictures`, {
    params: {
      page: currentPage.value,
      sort: sortByMapping.value.sort,
      direction: sortByMapping.value.direction,
    },
  })
}
</script>

<style>

</style>