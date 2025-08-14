<template>
  <div class="w-full">
    <div class="w-full min-h-[80svh] flex flex-col gap-4 items-center justify-center">
      <header class="flex items-center justify-between gap-4 px-5 pt-5">
        <UiContainer class="flex items-center justify-between">
          <h1 class="font-logo text-3xl/normal tracking-wide">Upload your pictures</h1>
        </UiContainer>
      </header>    
      <UiContainer>
        <event-upload-form />
      </UiContainer>
      <UiContainer v-if="isUploadCompleted" class="w-full px-2">
        <div class="bg-green-50 border border-green-200 rounded-lg w-full max-w-2xl mx-auto p-4 flex items-center gap-3">
          <svg class="size-6 text-green-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zM10 17l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <div>
            <h3 class="font-semibold text-green-800">Upload completed successfully!</h3>
            <p class="text-sm text-green-700">All your pictures have been uploaded and are now available to other guests.</p>
          </div>
        </div>
      </UiContainer>
      <UiContainer class="w-full px-2">
        <div class="bg-merino-50 border border-almond-200 rounded-lg w-full max-w-2xl mx-auto p-4 flex flex-col gap-4">
          <div class="flex gap-2 items-center">
            <svg class="size-5 text-almond-400" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48"><!-- Icon from IconPark Outline by ByteDance - https://github.com/bytedance/IconPark/blob/master/LICENSE --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path d="M12 8h24l8 10l-20 24L4 18zM4 18h40M24 42l-8-24m8 24l8-24"/><path d="m8 13l-4 5l20 24l20-24l-4-5"/></g></svg>
            <h2 class="tracking-wide text-xl font-logo">Share your best moments</h2>
          </div>
          <ul class="list-disc pl-6 flex flex-col gap-1 text-sm text-almond-700">
            <li>Every participants can see and download picture uploaded.</li>
            <li>Picture will be sorted by capture date.</li>
            <li>You can upload picture until {TODO}</li>
          </ul>
        </div>
      </UiContainer>
    </div>

    <EventUploadedPictureList/>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'guest-registration',
  layout: 'application',
})

const { isUploadCompleted } = useGlobalPictureUploader()

</script>
