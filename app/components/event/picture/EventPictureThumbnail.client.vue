<script lang="ts" setup>
import type { SerializeObject } from 'nitropack'
import type { UploadedPicture } from '~~/server/api/events/single/[id]/pictures/index.get'
import { useCountdown } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const { picture, displayFavoriteToggle = true, recordLongPress = false } = defineProps<{
  picture: SerializeObject<UploadedPicture>
  displayFavoriteToggle?: boolean
  recordLongPress?: boolean
}>()

const emits = defineEmits<{
  select: [SerializeObject<UploadedPicture>]
  longSelect: [SerializeObject<UploadedPicture>]
}>()

const LONG_PRESS_DURATION = 30

const { isInFavorite, toggleFavorite } = useFavoriteStorage()

const isLoaded = ref(false)
const shouldAnimate = ref(true)
const imageRef = ref<HTMLImageElement>()
const isLongPressing = ref(false)

function handleImageLoad() {
  isLoaded.value = true
}

// Check if image is already cached/loaded when component mounts
onMounted(() => {
  if (imageRef.value?.complete && imageRef.value?.naturalHeight > 0) {
    // Image is already loaded (cached), skip animation
    isLoaded.value = true
    shouldAnimate.value = false
  }
})

const { start, stop } = useCountdown(LONG_PRESS_DURATION, {
  interval: 10,
  onComplete: () => {
    isLongPressing.value = true
  },
})

function handleTouchStart() {
  if (recordLongPress) {
    start()
  }
}

function handleTouchEnd() {
  if (!recordLongPress) {
    emits('select', picture)
  }
  else {
    stop()

    if (isLongPressing.value) {
      emits('longSelect', picture)
    }
    else {
      emits('select', picture)
    }

    isLongPressing.value = false
  }
}
</script>

<template>
  <div class="relative overflow-hidden select-none">
    <button class="appearance-none border-0 rounded-none bg-none w-full h-full block" @touchstart="handleTouchStart" @click="handleTouchEnd" @mousedown="handleTouchStart" @contextmenu.prevent>
      <img
        ref="imageRef" :src="picture.thumbnailUrl" class="w-full aspect-square object-cover pointer-events-none" :class="[
          isLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          shouldAnimate ? 'transition-all duration-700' : '',
        ]" :data-loaded="isLoaded" @load="handleImageLoad"
      >
    </button>
    <ClientOnly>
      <button
        v-if="displayFavoriteToggle"
        class="absolute right-2 bottom-2 group transition-transform active:scale-95 bg-none appearance-none"
        :aria-pressed="isInFavorite(picture.id)" type="button" @click="toggleFavorite(picture.id)"
      >
        <svg
          class="size-7 text-white/30 stroke-1 stroke-almond-300 transition-colors group-aria-[pressed=true]:text-almond-300"
          xmlns="http://www.w3.org/2000/svg" width="32" height="32"
          viewBox="0 0 24 24"
        ><!-- Icon from Google Material Icons by Material Design Authors - https://github.com/material-icons/material-icons/blob/master/LICENSE -->
          <path
            fill="currentColor"
            d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"
          />
        </svg>
      </button>
    </ClientOnly>
  </div>
</template>
