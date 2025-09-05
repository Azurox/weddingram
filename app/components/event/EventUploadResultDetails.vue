<script lang="ts" setup>
const { latestUploadResult, isUploadCompleted } = useGlobalPictureUploader()

const shouldShowResults = computed(() => {
  return isUploadCompleted.value
    && latestUploadResult.value
    && (latestUploadResult.value.duplicateFiles.length > 0 || latestUploadResult.value.invalidFiles.length > 0)
})

const duplicateCount = computed(() => latestUploadResult.value?.duplicateFiles.length ?? 0)
const invalidCount = computed(() => latestUploadResult.value?.invalidFiles.length ?? 0)
const hasOnlyDuplicates = computed(() => duplicateCount.value > 0 && invalidCount.value === 0)
const allFilesFailed = computed(() => latestUploadResult.value?.successCount === 0)

// Helper function to check if content type is video
function isVideo(contentType: string): boolean {
  return contentType.startsWith('video/')
}
</script>

<template>
  <UiContainer v-if="shouldShowResults" class="w-full px-2 mt-4">
    <!-- Show special header for complete failure -->
    <div
      v-if="allFilesFailed"
      class="bg-red-50 border border-red-200 rounded-lg w-full max-w-2xl mx-auto p-4 mb-4"
    >
      <div class="flex items-center gap-3">
        <svg class="size-6 text-red-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17L12 13.41L8.41 17L7 15.59L10.59 12L7 8.41L8.41 7L12 10.59L15.59 7L17 8.41L13.41 12L17 15.59z" />
        </svg>
        <div>
          <h3 class="font-semibold text-red-800">
            No files were uploaded
          </h3>
          <p class="text-sm text-red-700">
            All selected files were either duplicates or invalid.
          </p>
        </div>
      </div>
    </div>

    <div
      class="border rounded-lg w-full max-w-2xl mx-auto p-4"
      :class="{
        'bg-red-50 border-red-200': invalidCount > 0,
        'bg-orange-50 border-orange-200': hasOnlyDuplicates,
      }"
    >
      <!-- Invalid files section -->
      <div v-if="invalidCount > 0" class="mb-3">
        <div class="flex items-center gap-2 mb-2">
          <svg class="size-5 text-red-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17L12 13.41L8.41 17L7 15.59L10.59 12L7 8.41L8.41 7L12 10.59L15.59 7L17 8.41L13.41 12L17 15.59z" />
          </svg>
          <h4 class="font-semibold text-red-800">
            {{ invalidCount }} file{{ invalidCount > 1 ? 's' : '' }} rejected
          </h4>
        </div>
        <div class="space-y-2">
          <div v-for="file in latestUploadResult?.invalidFiles" :key="file.name" class="bg-red-100 border border-red-200 rounded p-3">
            <div class="flex items-center gap-2">
              <svg class="size-4 text-red-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              </svg>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-red-800 truncate" :title="file.name">
                  {{ file.name }}
                </p>
                <p class="text-sm text-red-700">
                  {{ file.reason }}
                </p>
                <p class="text-xs text-red-600">
                  Content type: {{ file.contentType }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Duplicate files section -->
      <div v-if="duplicateCount > 0" :class="{ 'border-t pt-3': invalidCount > 0, 'border-red-200': invalidCount > 0, 'border-orange-200': hasOnlyDuplicates }">
        <div class="flex items-center gap-2 mb-2">
          <svg class="size-5 text-orange-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h4 class="font-semibold text-orange-800">
            {{ duplicateCount }} picture{{ duplicateCount > 1 ? 's' : '' }} ignored
          </h4>
        </div>
        <p class="text-sm text-orange-700 mb-3">
          These pictures were already uploaded:
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div v-for="file in latestUploadResult?.duplicateFiles" :key="file.hash" class="relative group">
            <div class="aspect-square rounded-lg overflow-hidden bg-neutral-100 relative flex items-center justify-center">
              <template v-if="isVideo(file.contentType)">
                <video
                  :src="file.file" class="w-full h-full object-cover transition-all duration-200 relative" muted playsinline preload="metadata"
                />
                <svg v-if="file.contentType !== 'video/mp4'" class="size-12 text-almond-400 absolute" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 12 12"><!-- Icon from Garden SVG Icons by Zendesk - https://github.com/zendeskgarden/svg-icons/blob/main/LICENSE.md --><path fill="none" stroke="currentColor" stroke-linecap="round" d="M10.5 3.21V11c0 .28-.22.5-.5.5H2c-.28 0-.5-.22-.5-.5V1c0-.28.22-.5.5-.5h5.79c.13 0 .26.05.35.15l2.21 2.21c.1.09.15.21.15.35zM7.5.5V3c0 .28.22.5.5.5h2.5M4 9.5l4-4m0 4l-4-4" /></svg>
                <span class="absolute bottom-2 right-2 left-2 text-center text-white text-shadow-neutral-500 text-shadow-md tracking-wider z-10">video</span>
              </template>
              <template v-else>
                <img
                  :src="file.file"
                  :alt="file.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                >
              </template>
            </div>
            <div class="mt-1">
              <p class="text-xs text-orange-700 font-medium truncate" :title="file.name">
                {{ file.name }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UiContainer>
</template>
