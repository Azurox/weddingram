<script lang="ts" setup>
import UiContainer from '~/components/ui/UiContainer.vue'

definePageMeta({
  middleware: 'guest-registration',
  layout: 'application',
})
</script>

<template>
  <div class="w-full">
    <header class="p-5 border-b border-b-almond-700/20">
      <UiContainer class="flex items-center justify-between gap-4">
        <h1 class="font-logo text-2xl/normal tracking-wide">
          Favorite
        </h1>
        <button
          class="text-sm font-normal pl-1 pr-3 py-1 rounded-2xl bg-white border border-almond-200 flex items-center gap-2"
        >
          <svg class="size-6 text-almond-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
            <path fill="currentColor" d="M7 17h10v-2H7zm5-3l4-4l-1.4-1.4l-1.6 1.55V6h-2v4.15L9.4 8.6L8 10zm0 8q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" />
          </svg>
          <span>Download all</span>
        </button>
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
