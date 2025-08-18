<script lang="ts" setup>
definePageMeta({
  middleware: 'guest-registration',
  layout: 'application',
})

const { uuid } = useRoute().params as { uuid: string }
const { data: event } = await useFetch(`/api/events/single/${uuid}`, { key: `event:${uuid}:details` })
</script>

<template>
  <div class="w-full flex flex-col">
    <header class="border-b border-b-almond-700/20">
      <UiContainer class="flex justify-between items-center gap-4 px-5 py-4">
        <div class="flex items-center gap-4 justify-center">
          <div class="rounded-full size-6 bg-almond-400" />
          <div>
            <h1 class="font-logo text-2xl/normal tracking-wide">
              Weddingram
            </h1>
            <p class="text-sm font-medium text-almond-700">
              {{ event?.name }}
            </p>
          </div>
        </div>
        <div v-if="event" class="text-almond-700 font-medium text-xs">
          {{ event.pictureCount }}
          <template v-if="event.pictureCount && event.pictureCount > 1">
            pictures
          </template>
          <template v-else>
            picture
          </template>
        </div>
      </UiContainer>
    </header>
    <div>
      <event-picture-thumbnail-list />
    </div>
  </div>
</template>
