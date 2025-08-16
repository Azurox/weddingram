<template>
  <aside class="overflow-auto fixed inset-0 z-40 bg-white flex flex-col">
    <button class="py-4 px-2 appearance-none border-0 rounded-none text-left font-logo text-2xl bg-almond-50" @click="emits('close')">
      <UiContainer class="flex gap-2 items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-6" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m14 18l-6-6l6-6l1.4 1.4l-4.6 4.6l4.6 4.6z"/></svg> 
        <span>
          {{ goBackContext }}
        </span>  
      </UiContainer>
    </button>
    <div ref="scrollContainer" class="flex flex-col gap-10 snap-y snap-proximity overflow-auto scroll-pt-4 pt-4 pb-40">
      <EventPictureInstaViewThumbnail v-for="picture in pictureList" :id="`instaview-${picture.id}`" :key="picture.id" :picture="picture"/>
      <span v-if="!hasMore && !isLoading" class="text-center text-2xl italic text-neutral-600 font-logo">
        The end.
      </span>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import type { UploadedPicture } from '~~/server/api/events/single/[id]/pictures/index.get';
import type { SerializeObject } from 'nitropack'
import { useInfiniteScroll } from '@vueuse/core'

const {goBackContext = 'Home', hasMore = false, isLoading, initialPictureId}  = defineProps<{
  pictureList: SerializeObject<UploadedPicture>[]
  goBackContext?: string,
  hasMore?: boolean,
  isLoading: boolean
  initialPictureId?: string
}>()

const emits = defineEmits<{
  close: []
  nextPage: []
}>()

const scrollContainer = useTemplateRef('scrollContainer')

useInfiniteScroll(
  scrollContainer,
  () => {
    if(!isLoading ) {
      emits('nextPage')
    }
  },
  {
    distance: 800,
    canLoadMore: () => {
      return hasMore && !isLoading
    },
  }
)

onMounted(() => {
  if (initialPictureId) {
    const initialElement = document.getElementById(`instaview-${initialPictureId}`)
    if (initialElement) {
      initialElement.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }
})
</script>
