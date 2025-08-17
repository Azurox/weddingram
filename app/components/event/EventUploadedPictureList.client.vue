<script lang="ts" setup>
const { uploadedPictures } = useUploadedPictureStorage()
const { isDeleting, deletePicturesByMagicIds } = usePictureDelete()

const selectedPictures = ref(new Set<string>())
const isSelectionMode = computed(() => selectedPictures.value.size > 0)

function toggleSelection(deleteId: string) {
  if (selectedPictures.value.has(deleteId)) {
    selectedPictures.value.delete(deleteId)
  }
  else {
    selectedPictures.value.add(deleteId)
  }
  selectedPictures.value = new Set(selectedPictures.value)
}

async function handleDelete() {
  if (selectedPictures.value.size === 0)
    return

  const deleteIds = Array.from(selectedPictures.value)

  try {
    await deletePicturesByMagicIds(deleteIds)
    selectedPictures.value.clear()
  }
  catch (error) {
    console.error('Failed to delete pictures:', error)
  }
}
</script>

<template>
  <div v-if="uploadedPictures.length > 0" class="mt-8 pb-30">
    <div class="px-5 mb-4">
      <UiContainer>
        <h2 class="text-xl font-semibold text-gray-800">
          Your Uploaded Pictures
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          <template v-if="uploadedPictures.length > 1">
            {{ uploadedPictures.length }} pictures uploaded
          </template>
          <template v-else>
            {{ uploadedPictures.length }} picture uploaded
          </template>
        </p>
      </UiContainer>
    </div>

    <UiContainer>
      <!-- Picture Grid -->
      <form id="self-uploaded-picture-delete-form" @submit.prevent="">
        <fieldset class="grid grid-cols-3" :disabled="isDeleting">
          <button
            v-for="picture in uploadedPictures" :key="picture.id"
            class="relative aspect-square cursor-pointer group appearance-none border-0 rounded-none bg-none"
            type="button" @click="toggleSelection(picture.deleteId)"
          >
            <img
              :src="picture.url" alt=""
              class="w-full h-full object-cover transition-all duration-200 relative" :class="{
                'ring-4 ring-merino-400 ring-opacity-70 z-10': selectedPictures.has(picture.deleteId),
                'group-hover:opacity-90': !selectedPictures.has(picture.deleteId),
                'animate-pulse': selectedPictures.has(picture.deleteId) && isDeleting,
              }" loading="lazy"
            >
            <div
              v-if="isSelectionMode"
              class="absolute z-20 top-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200"
              :class="{
                'bg-merino-400': selectedPictures.has(picture.deleteId),
                'bg-white bg-opacity-50': !selectedPictures.has(picture.deleteId),
              }"
            >
              <svg
                v-if="selectedPictures.has(picture.deleteId)" class="w-4 h-4 text-white" fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </button>
        </fieldset>
      </form>
    </UiContainer>

    <Transition name="slide-in">
      <UiContainer
        v-if="selectedPictures.size > 0"
        class="fixed right-10 left-10 bottom-16 z-30 pointer-events-none flex"
      >
        <div class="ml-auto relative">
          <button
            type="submit" form="self-uploaded-picture-delete-form" :disabled="isDeleting"
            class="group bg-almond-500 hover:bg-almond-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform pointer-events-auto active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            @click="handleDelete"
          >
            <svg class="w-6 h-6 transition-opacity group-disabled:opacity-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>

            <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-disabled:opacity-100">
              <UiLoadingIcon />
            </div>
          </button>

          <div
            class="absolute -top-2 -left-2 bg-almond-600 text-white text-xs rounded-full w-6 h-6 flex items-center transition-opacity justify-center"
          >
            {{ selectedPictures.size }}
          </div>
        </div>
      </UiContainer>
    </Transition>
  </div>
</template>

<style scoped>
.slide-in-enter-active,
.slide-in-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.slide-in-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.slide-in-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
