<script lang="ts" setup>
definePageMeta({
  middleware: 'admin-registration',
})

const creationDialog = useTemplateRef('creationDialog')
const { data: events } = await useFetch('/api/events')

function toggleCreationDialog() {
  if (creationDialog.value?.open) {
    creationDialog.value.close()
  }
  else {
    creationDialog.value?.showModal()
  }
}
</script>

<template>
  <div class="bg-merino-100 w-full">
    <header class="max-w-3xl mx-auto flex items-center justify-between p-4">
      <h1 class="text-3xl font-logo">
        Weddingram
      </h1>
      <div>
        <button
          class="flex items-center gap-2 justify-center px-4 w-full max-w-sm py-1 bg-almond-500 rounded-3xl font-medium text-white tracking-wide border-transparent border transition-colors
              hover:bg-white hover:text-merino-950 hover:border-almond-500
              active:bg-white active:text-merino-950 active:border-almond-500" @click="toggleCreationDialog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24"
          ><!-- Icon from Huge Icons by Hugeicons - undefined -->
            <path
              fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 4v16m8-8H4" color="currentColor"
            />
          </svg>
          <span>New event</span>
        </button>
      </div>
    </header>
    <div class="max-w-5xl mx-auto p-4">
      <AdminEventList v-if="events" :events="events" />
    </div>
    <dialog ref="creationDialog">
      <AdminEventCreationForm />
    </dialog>
  </div>
</template>
