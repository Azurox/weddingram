<template>
  <div class="w-full flex flex-col gap-4 items-center justify-center">
    <header class="flex items-center justify-between gap-4 px-5 pt-5">
      <UiContainer class="flex items-center justify-between">
        <h1 class="font-logo text-3xl/normal tracking-wide">Upload your pictures</h1>
      </UiContainer>
    </header>
    <UiContainer>
      <event-upload-form />
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
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'guest-registration',
  layout: 'application',
})

const { uuid } = useRoute().params as { uuid: string };

</script>

<style></style>