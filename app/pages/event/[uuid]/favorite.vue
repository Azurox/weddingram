<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'
import UiContainer from '~/components/ui/UiContainer.vue'

definePageMeta({
  middleware: 'guest-registration',
  layout: 'application',
})

const route = useRoute()
const { uuid } = route.params as { uuid: string }
const { favorites } = useFavoriteStorage()

const isDownloadingAll = ref(false)
const downloadProgress = ref({ current: 0, total: 0 })
const downloadAbortController = ref<AbortController | null>(null)

// Prevent navigation during download
useEventListener(window, 'beforeunload', (event) => {
  if (isDownloadingAll.value) {
    event.preventDefault()
    return 'Download in progress. Are you sure you want to leave?'
  }
})

onBeforeRouteLeave((_to, _from, next) => {
  if (isDownloadingAll.value) {
    // eslint-disable-next-line no-alert
    if (confirm('Download in progress. Are you sure you want to leave?')) {
      // Cancel the download before leaving
      if (downloadAbortController.value) {
        downloadAbortController.value.abort()
        downloadAbortController.value = null
      }
      isDownloadingAll.value = false
      downloadProgress.value = { current: 0, total: 0 }
      next()
    }
    else {
      next(false)
    }
  }
  else {
    next()
  }
})

const favoriteIds = computed(() =>
  Object.entries(favorites.value)
    .filter(([_, isFavorite]) => isFavorite)
    .map(([id]) => id),
)

const downloadPercentage = computed(() => {
  if (downloadProgress.value.total === 0)
    return 0
  return Math.round((downloadProgress.value.current / downloadProgress.value.total) * 100)
})

async function downloadInBatches<T>(
  items: T[],
  processor: (item: T, signal?: AbortSignal) => Promise<Response>,
  concurrency = 6,
  onProgress?: (current: number, total: number) => void,
  abortSignal?: AbortSignal,
): Promise<Response[]> {
  const results: Response[] = []

  for (let i = 0; i < items.length; i += concurrency) {
    if (abortSignal?.aborted) {
      throw new Error('Download cancelled by user')
    }

    const batch = items.slice(i, i + concurrency)

    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item, abortSignal)),
    )

    const successfulResults = batchResults
      .filter((result): result is PromiseFulfilledResult<Response> =>
        result.status === 'fulfilled' && result.value.ok,
      )
      .map(result => result.value)

    results.push(...successfulResults)

    const failedCount = batchResults.filter(result =>
      result.status === 'rejected'
      && !result.reason?.name?.includes('AbortError'),
    ).length

    if (failedCount > 0) {
      console.warn(`Batch ${Math.floor(i / concurrency) + 1}: ${failedCount} downloads failed, continuing with ${successfulResults.length} successful`)
    }

    if (onProgress) {
      onProgress(Math.min(i + concurrency, items.length), items.length)
    }
  }

  return results
}

async function handleDownloadAll() {
  if (favoriteIds.value.length === 0)
    return

  isDownloadingAll.value = true
  downloadProgress.value = { current: 0, total: favoriteIds.value.length }

  downloadAbortController.value = new AbortController()
  const abortSignal = downloadAbortController.value.signal

  try {
    const clientZip = await import('client-zip')
    const { downloadAsBlob } = await import('~/services/utilService')

    const BATCH_SIZE = 50
    const allPictures: any[] = []

    for (let i = 0; i < favoriteIds.value.length; i += BATCH_SIZE) {
      if (abortSignal.aborted) {
        throw new Error('Download cancelled by user')
      }

      const batch = favoriteIds.value.slice(i, i + BATCH_SIZE)

      const data = await $fetch(`/api/events/single/${uuid}/pictures/batch`, {
        method: 'get',
        params: { pictureIds: batch },
        signal: abortSignal,
      })

      if (data && Array.isArray(data)) {
        allPictures.push(...data)
      }
    }

    const downloadedFiles = await downloadInBatches(
      allPictures,
      (picture, signal) => fetch(picture.url, { signal }),
      6, // 6 concurrent downloads (browser optimal)
      (current, total) => {
        downloadProgress.value = { current, total }
      },
      abortSignal,
    )

    const finalBlob = await (clientZip.downloadZip(downloadedFiles)).blob()

    const totalRequested = favoriteIds.value.length
    const successfulDownloads = downloadedFiles.length
    const failedDownloads = totalRequested - successfulDownloads

    if (failedDownloads > 0) {
      console.warn(`Download completed: ${successfulDownloads}/${totalRequested} pictures (${failedDownloads} failed or unavailable)`)
    }

    downloadAsBlob(finalBlob, `all-favorites-${downloadedFiles.length}_pictures-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`)
  }
  catch (error: unknown) {
    const customError = error as Error
    if (customError?.name === 'AbortError' || customError?.message?.includes('cancelled')) {
      console.warn('Download cancelled by user')
    }
    else {
      console.error('Error downloading all favorite pictures:', error)
      // TODO: Show error toast
    }
  }
  finally {
    isDownloadingAll.value = false
    downloadProgress.value = { current: 0, total: 0 }
    downloadAbortController.value = null
  }
}
</script>

<template>
  <div class="w-full">
    <header class="p-5 border-b border-b-almond-700/20">
      <UiContainer class="flex items-center justify-between gap-4">
        <h1 class="font-logo text-2xl/normal tracking-wide">
          Favorite
        </h1>
        <div class="relative rounded-2xl  border border-almond-200 overflow-hidden">
          <button
            class="text-sm font-normal pl-1 pr-3 py-1  bg-white  flex items-center gap-2"
            :disabled="isDownloadingAll"
            @click="handleDownloadAll"
          >
            <svg class="size-6 text-almond-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
              <path fill="currentColor" d="M7 17h10v-2H7zm5-3l4-4l-1.4-1.4l-1.6 1.55V6h-2v4.15L9.4 8.6L8 10zm0 8q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" />
            </svg>
            <span>Download all</span>
          </button>
          <div class="absolute inset-0 pointer-events-none">
            <div
              v-show="true"
              class="absolute left-0 right-0 bottom-0 bg-almond-500 rounded-2xl transition-all duration-500 ease-out"
              :class="isDownloadingAll ? 'h-full' : 'h-0'"
            />

            <Transition
              enter-active-class="transition-opacity duration-300 delay-200 ease-out"
              leave-active-class="transition-opacity duration-150 ease-in"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div v-if="isDownloadingAll" class="absolute inset-0 flex items-center justify-center z-50">
                <span class="text-white font-medium">
                  {{ downloadPercentage }}%
                </span>
              </div>
            </Transition>
          </div>
        </div>
      </UiContainer>
    </header>
    <div>
      <div class="bg-almond-50 px-2 py-3 border-b border-b-almond-700/20 text-sm">
        <UiContainer class="flex items-center gap-4">
          Long press on a picture to manage multiple pictures at once.
        </UiContainer>
      </div>

      <ClientOnly>
        <event-picture-thumbnail-favorite-list />
      </ClientOnly>
    </div>
  </div>
</template>
