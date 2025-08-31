<script lang="ts" setup>
import type { SerializeObject } from 'nitropack'
import type { UploadedPicture } from '~~/server/api/events/single/[id]/pictures/index.get'
import { useInfiniteScroll } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import UiContainer from '~/components/ui/UiContainer.vue'
import { ToastService } from '~/services/ToastService'
import { downloadAsBlob } from '~/services/utilService'

const PAGE_SIZE = 20
const currentPage = ref(1)
const favoritePictureList = ref<SerializeObject<UploadedPicture>[]>([])
const hasMore = ref(true)
const pending = ref(false)
const instaViewFocusedPictureId = ref<string | null>(null)

const { uuid } = useRoute().params as { uuid: string }
const { favorites, removeFavorite } = useFavoriteStorage()
const selectedPictures = ref(new Set<string>())
const isLoadingMultiDownload = ref(false)

const favoriteIds = computed(() =>
  Object.entries(favorites.value)
    .filter(([_, isFavorite]) => isFavorite)
    .map(([id]) => id),
)

async function fetchFavoritePictures(page: number) {
  if (favoriteIds.value.length === 0) {
    favoritePictureList.value = []
    hasMore.value = false
    return
  }
  pending.value = true
  const idsForPage = favoriteIds.value.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  if (idsForPage.length === 0) {
    hasMore.value = false
    pending.value = false
    return
  }
  const data = await $fetch(`/api/events/single/${uuid}/pictures/batch`, {
    method: 'get',
    params: { pictureIds: idsForPage },
    key: `favorites-page-${page}`,
    immediate: true,
  })

  if (data && Array.isArray(data)) {
    // Clean up localStorage: remove IDs that weren't returned by the backend
    const returnedIds = data.map(picture => picture.id)
    const deletedIds = idsForPage.filter(id => !returnedIds.includes(id))

    if (deletedIds.length > 0) {
      const { removeFavorite } = useFavoriteStorage()
      deletedIds.forEach(id => removeFavorite(id))
    }

    if (page === 1) {
      favoritePictureList.value = data
    }
    else {
      favoritePictureList.value = [...favoritePictureList.value, ...data]
    }
    // Check if we have more pages to load based on remaining favorite IDs
    const totalProcessedIds = page * PAGE_SIZE
    hasMore.value = totalProcessedIds < favoriteIds.value.length
  }
  else {
    hasMore.value = false
  }
  pending.value = false
}

const isInMultiSelectMode = computed(() => selectedPictures.value.size > 0)

watch(favorites, (newFavorites) => {
  favoritePictureList.value = favoritePictureList.value.filter(picture => newFavorites[picture.id] === true)
}, { deep: true, immediate: true })

watchOnce(favorites, async () => {
  currentPage.value = 1
  await fetchFavoritePictures(1)
}, { immediate: true })

useInfiniteScroll(
  window,
  async () => {
    if (!pending.value && hasMore.value) {
      currentPage.value += 1
      await fetchFavoritePictures(currentPage.value)
    }
  },
  {
    distance: 300,
    canLoadMore: () => hasMore.value && !pending.value,
  },
)

function selectPicture(picture: SerializeObject<UploadedPicture>) {
  if (isInMultiSelectMode.value) {
    longSelectPicture(picture)
  }
  else {
    instaViewFocusedPictureId.value = picture.id
  }
}

function hideInstaView() {
  instaViewFocusedPictureId.value = null
}

async function longSelectPicture(picture: SerializeObject<UploadedPicture>) {
  if (selectedPictures.value.has(picture.id)) {
    selectedPictures.value.delete(picture.id)
  }
  else {
    selectedPictures.value.add(picture.id)
  }
}

function handleMultiRemoveFavorite() {
  const selectedIds = Array.from(selectedPictures.value)

  for (let i = 0; i < selectedIds.length; i++) {
    const element = selectedIds[i]

    if (element) {
      removeFavorite(element)
    }
  }

  favoritePictureList.value = favoritePictureList.value.filter(picture =>
    !selectedPictures.value.has(picture.id),
  )

  selectedPictures.value.clear()
}

async function handleMultiDownload() {
  isLoadingMultiDownload.value = true

  try {
    const clientZip = await import('client-zip')
    const downloadedFilesPromises: Promise<Response>[] = []
    selectedPictures.value.forEach((pictureId) => {
      const picture = favoritePictureList.value.find(p => p.id === pictureId)
      if (picture) {
        downloadedFilesPromises.push(
          fetch(picture.url),
        )
      }
    })

    const downloadedFiles = await Promise.all(downloadedFilesPromises)

    const finalBlob = await (clientZip.downloadZip(downloadedFiles)).blob()

    downloadAsBlob(finalBlob, `favorites-${downloadedFiles.length}_pictures-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`)
  }
  catch (error) {
    console.error('Error downloading selected pictures:', error)
    useToast().error({
      title: 'Download Error',
      message: 'An error occurred while downloading the selected pictures. Please try again later.',
      ...ToastService.getPresetForError(),
    })
  }
  finally {
    isLoadingMultiDownload.value = false
  }
}
</script>

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
      <UiContainer class="grid grid-cols-3 gap" :class="{ 'pointer-events-none': isLoadingMultiDownload }">
        <div
          v-for="picture in favoritePictureList" :key="picture.id" class="relative duration-200 transition-all" :class="{
            'ring-4 ring-merino-400 ring-opacity-70 z-10': selectedPictures.has(picture.id),
            'opacity-80': isLoadingMultiDownload && !selectedPictures.has(picture.id) }"
        >
          <event-picture-thumbnail
            :picture="picture"
            :display-favorite-toggle="false"
            record-long-press
            :selected="selectedPictures.has(picture.id)"
            @select="selectPicture(picture)"
            @long-select="longSelectPicture(picture)"
          />

          <div
            v-if="isInMultiSelectMode"
            class="absolute z-20 top-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200"
            :class="{
              'bg-merino-400': selectedPictures.has(picture.id),
              'bg-white bg-opacity-50': !selectedPictures.has(picture.id),
            }"
          >
            <svg
              v-if="selectedPictures.has(picture.id)" class="w-4 h-4 text-white" fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
      </UiContainer>
    </template>

    <Transition name="slide-in">
      <UiContainer
        v-if="selectedPictures.size > 0"
        class="fixed right-10 left-10 bottom-16 z-30 pointer-events-none flex gap-6 justify-end"
      >
        <div class="relative">
          <button
            type="button"
            :disabled="isLoadingMultiDownload"
            class="group bg-almond-500 hover:bg-almond-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform pointer-events-auto flex items-center justify-center active:scale-95 disabled:opacity-60"
            @click="handleMultiRemoveFavorite"
          >
            <svg class="size-6 text-white" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 56 56"><!-- Icon from Framework7 Icons by Vladimir Kharlampidi - https://github.com/framework7io/framework7-icons/blob/master/LICENSE --><path fill="currentColor" d="M45.156 49.012c.703.703 1.876.703 2.555 0a1.81 1.81 0 0 0 0-2.555L6.72 5.488a1.84 1.84 0 0 0-2.578 0c-.68.68-.68 1.875 0 2.555Zm-.515-9.586c5.039-5.461 7.898-11.25 7.898-17.086c0-8.297-5.672-14.156-13.289-14.156c-4.336 0-7.852 2.062-9.984 5.226c-2.086-3.14-5.625-5.226-9.985-5.226c-1.78 0-3.445.328-4.945.96l3.117 3.118c.54-.211 1.149-.305 1.781-.305c4.43 0 6.938 2.742 8.438 5.086c.656.938 1.055 1.195 1.594 1.195c.562 0 .914-.281 1.593-1.195c1.618-2.297 4.055-5.086 8.438-5.086c5.46 0 9.492 4.148 9.492 10.383c0 4.758-2.766 9.726-6.914 14.32ZM29.266 51.215c.492 0 1.195-.328 1.71-.633c2.462-1.594 4.782-3.21 6.891-4.898l-2.695-2.672a68 68 0 0 1-5.414 3.96c-.235.165-.399.282-.492.282c-.07 0-.235-.117-.47-.281c-9.82-6.516-19.03-15.914-19.03-24.633c0-1.477.258-2.813.703-4.008l-2.906-2.906c-1.008 1.992-1.57 4.336-1.57 6.914c0 9.984 8.366 19.805 21.585 28.242c.492.305 1.219.633 1.688.633" /></svg>
          </button>
        </div>
        <div class="relative">
          <button
            :disabled="isLoadingMultiDownload"
            type="button"
            class="group bg-almond-500 hover:bg-almond-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform pointer-events-auto
            active:scale-95"
            @click="handleMultiDownload"
          >
            <svg class="size-6 text-white transition-opacity group-disabled:opacity-0" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m12 16l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11zm-8 4v-5h2v3h12v-3h2v5z" /></svg>
            <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-disabled:opacity-100">
              <UiLoadingIcon />
            </div>
          </button>
        </div>
      </UiContainer>
    </Transition>

    <Transition name="full-screen-slide" appear>
      <EventPictureInstaView
        v-if="favoritePictureList && instaViewFocusedPictureId" :picture-list="favoritePictureList" :initial-picture-id="instaViewFocusedPictureId"
        go-back-context="Favorite" :has-more="hasMore" :is-loading="pending" @next-page="currentPage++"
        @close="hideInstaView"
      />
    </Transition>
  </div>
</template>
