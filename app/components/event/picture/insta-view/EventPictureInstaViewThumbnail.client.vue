<script lang="ts" setup>
import type { SerializeObject } from 'nitropack'
import type { UploadedPicture } from '~~/server/api/events/single/[id]/pictures/index.get'
import UiContainer from '~/components/ui/UiContainer.vue'

defineProps<{
  picture: SerializeObject<UploadedPicture>
}>()

const { isInFavorite, toggleFavorite } = useFavoriteStorage()
</script>

<template>
  <UiContainer class="snap-start flex flex-col gap-1 w-full">
    <div class="flex gap-2 px-2">
      <svg class="text-almond-400 size-6" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M5.85 17.1q1.275-.975 2.85-1.537T12 15t3.3.563t2.85 1.537q.875-1.025 1.363-2.325T20 12q0-3.325-2.337-5.663T12 4T6.337 6.338T4 12q0 1.475.488 2.775T5.85 17.1M12 13q-1.475 0-2.488-1.012T8.5 9.5t1.013-2.488T12 6t2.488 1.013T15.5 9.5t-1.012 2.488T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" /></svg>
      <span class="capitalize">{{ picture.guestNickname }}</span>
    </div>
    <img :src="picture.url" alt="" class="w-full h-auto object-contain max-h-[70svh] bg-almond-500/5">
    <div class="flex gap-2 px-2 items-baseline mt-1">
      <button class="group transition-transform active:scale-95" :aria-pressed="isInFavorite(picture.id)" type="button" @click="toggleFavorite(picture.id)">
        <svg class="size-7 text-white/30 stroke-1 stroke-almond-300 transition-colors group-aria-[pressed=true]:text-almond-300" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Google Material Icons by Material Design Authors - https://github.com/material-icons/material-icons/blob/master/LICENSE --><path fill="currentColor" d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
      </button>
      <a
        download :href="picture.url"
        class="text-sm font-normal pl-1 pr-3 py-1 rounded-2xl bg-white border border-almond-200 flex items-center gap-2"
      >
        <svg class="size-6 text-almond-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
          <path fill="currentColor" d="M7 17h10v-2H7zm5-3l4-4l-1.4-1.4l-1.6 1.55V6h-2v4.15L9.4 8.6L8 10zm0 8q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" />
        </svg>
        <span>Download</span>
      </a>
    </div>
    <small class="px-2 text-sm text-neutral-600">
      Captured on <nuxt-time :datetime="picture.capturedAt" month="short" day="numeric" hour="2-digit" minute="2-digit" />
    </small>
  </UiContainer>
</template>
