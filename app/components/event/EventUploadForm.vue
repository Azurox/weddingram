<script lang="ts" setup>
import { useTimeoutFn } from '@vueuse/core'

const { handleFileInput, files } = useFileStorage()
const { uploadPictures, isLoading } = useGlobalPictureUploader()

// Reactive state for drag and drop
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const showProgress = ref(false)

const { isPending, start } = useTimeoutFn(() => {
  if (isLoading.value === false) {
    showProgress.value = false
  }
}, 2000, { immediate: false })

// Drag and drop handlers
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const droppedFiles = event.dataTransfer?.files
  if (droppedFiles && droppedFiles.length > 0) {
    const filesArray = Array.from(droppedFiles)
    handleFileInput({ target: { files: filesArray } })
  }
}

// Trigger file input click
function triggerFileInput() {
  fileInputRef.value?.click()
}

// Handle file input and trigger upload immediately
async function handleFileInputAndUpload(event: Event) {
  handleFileInput(event)
}

watchDebounced(files, async () => {
  if (files.value && files.value.length > 0 && !isLoading.value) {
    startUploadProcess()
  }
}, { deep: true, flush: 'post', debounce: 300 })

async function startUploadProcess() {
  showProgress.value = true
  start()
  await uploadPictures(files.value)

  if (isPending.value === false && showProgress.value === true) {
    showProgress.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto p-6">
    <form @submit.prevent="">
      <fieldset>
        <button
          class="appearance-none w-full relative cursor-pointer transition-all duration-300 ease-out min-h-[200px] flex items-center justify-center active:scale-95"
          @click="triggerFileInput"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <div class="absolute w-48 h-48 rounded-2xl border-3 border-dashed transition-all duration-300 ease-out shadow-lg bg-white rotate-6 border-merino-300" />

          <div
            class="relative w-48 h-48 rounded-2xl border-3 border-dashed transition-all duration-300 ease-out bg-white shadow-xl z-10 flex flex-col items-center justify-center text-center p-6 border-almond-400 -rotate-2 hover:-rotate-6"
          >
            <div class="mb-4">
              <svg class="size-12 text-almond-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" /></svg>
            </div>

            <p class="text-sm text-almond-600 leading-relaxed">
              Click here to upload pictures and videos.
            </p>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*,video/*"
            class="hidden"
            @change="handleFileInputAndUpload"
          >
        </button>
      </fieldset>
    </form>

    <event-upload-form-status :should-display="showProgress" />
  </div>
</template>
