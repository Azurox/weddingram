<script lang="ts" setup>
import type { SerializeObject } from 'nitropack'
import type { UploadedPicture } from '~~/server/api/events/single/[id]/pictures/index.get'
import { useInfiniteScroll } from '@vueuse/core'

type AvailableSortby = 'recent' | 'startOfWedding' | 'endOfWedding'

const { uuid } = useRoute().params as { uuid: string }
const router = useRouter()
const pictureList = ref<SerializeObject<UploadedPicture>[]>()
const selectedSortby = ref<AvailableSortby>('recent')
const currentPage = ref(1)
const instaViewFocusedPictureId = ref<string | null>(null)

const sortByMapping = computed(() => {
  switch (selectedSortby.value) {
    case 'recent': return { sort: 'createdAt', direction: 'desc' }
    case 'startOfWedding': return { sort: 'capturedAt', direction: 'asc' }
    case 'endOfWedding': return { sort: 'capturedAt', direction: 'desc' }
    default: return { sort: 'createdAt', direction: 'desc' }
  }
})

const fetchParams = computed(() => ({
  page: currentPage.value,
  sortBy: sortByMapping.value.sort,
  sortOrder: sortByMapping.value.direction,
}))

function showInstaView(picture: SerializeObject<UploadedPicture>) {
  nextTick(() => {
    instaViewFocusedPictureId.value = picture.id
    // Navigation is handled by the EventPictureInstaView component itself
  })
  router.push({ hash: `#insta-view` })
}

function hideInstaView() {
  instaViewFocusedPictureId.value = null
  // Clear the hash when closing
  router.replace({ hash: '' })
}

const { data: thumbnails, pending, refresh } = await useFetch(`/api/events/single/${uuid}/pictures`, {
  method: 'GET',
  params: fetchParams,
  lazy: true,
})

// Reset pagination and refresh when sort changes
watch(selectedSortby, () => {
  currentPage.value = 1
  refresh()
})

const hasMore = computed(() => {
  return thumbnails.value?.pagination.hasNextPage ?? false
})

watch(thumbnails, (newVal) => {
  if (newVal) {
    if (currentPage.value === 1) {
      pictureList.value = newVal.pictures
    }
    else {
      pictureList.value = [...(pictureList.value ?? []), ...newVal.pictures]
    }
  }
}, { immediate: true })

useInfiniteScroll(
  window,
  () => {
    if (!pending.value) {
      currentPage.value += 1
    }
  },
  {
    distance: 300,
    canLoadMore: () => {
      return hasMore.value && !pending.value
    },
  },
)
</script>

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
            <option value="recent">
              Recently uploaded
            </option>
            <option value="startOfWedding">
              Start of Wedding
            </option>
            <option value="endOfWedding">
              End of Wedding
            </option>
          </select>
        </UiContainer>
      </div>
      <UiContainer class="grid grid-cols-3 gap">
        <event-picture-thumbnail v-for="thumbnail in pictureList" :key="thumbnail.id" :picture="thumbnail" @select="showInstaView(thumbnail)" />
      </UiContainer>

      <Transition name="full-screen-slide" appear>
        <EventPictureInstaView v-if="instaViewFocusedPictureId" :picture-list="pictureList || []" :initial-picture-id="instaViewFocusedPictureId" go-back-context="Home" :has-more="hasMore" :is-loading="pending" allow-double-tap @next-page="currentPage++" @close="hideInstaView" />
      </Transition>
    </template>
  </div>
</template>
