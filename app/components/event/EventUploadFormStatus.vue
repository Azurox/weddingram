<template>
  <Transition name="reveal" appear>
    <div v-if="shouldDisplay" class="main fixed inset-0 z-20 flex flex-col items-center justify-center gap-10 px-4">
        <span class="font-logo text-2xl tracking-wide">Uploading your pictures...</span>
        <div class="loader text-almond-300"/>
        <span class="font-bold">Progress: {{ formatedProgressString }}</span>

        <UiContainer v-if="progress && progress.total > 10" class="w-full">
          <span class="p-4  mt-10 block bg-white border border-dashed border-almond-500 text-neutral-600 text-center rounded-lg">
            Do not quit this page until the upload is finished. You can save your battery and upload your pictures tomorrow.
          </span>
        </UiContainer>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
defineProps<{
  shouldDisplay: boolean
}>()

const { progress } = useGlobalPictureUploader()

const formatedProgressString = computed(() => {
  const numberOfPictureUploaded = Math.max(progress.value?.current ?? 1, 1)
  const maxNumberOfPicture = Math.max(progress.value?.total ?? 1, numberOfPictureUploaded)

  return `${numberOfPictureUploaded} / ${maxNumberOfPicture}`
})

</script>

<style scoped>
.main {
  background: radial-gradient(900px 600px at 85% -10%, rgba(201, 167, 76, 0.10), transparent 55%),
    radial-gradient(900px 700px at -10% 105%, rgba(201, 167, 76, 0.06), transparent 60%),
    #fbfaf7;
}

.reveal-enter-active,
.reveal-leave-active {
  transition: clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transition-behavior: allow-discrete;
}

.reveal-enter-from,
.reveal-leave-to {
  clip-path: circle(0% at 50% 50%);
}

.reveal-enter-to,
.reveal-leave-from {
  clip-path: circle(100% at 50% 50%);
}

.loader {
  width: 90px;
  height: 14px;
  background: 
    linear-gradient(90deg,#00000000 16px, currentColor 0 30px, #0000 0),
    radial-gradient(circle closest-side at 68% 50%, currentColor 92%,#0000),
    conic-gradient(from   45deg at calc(100% - 7px) 50%,currentColor 90deg,#0000 0),
    conic-gradient(from -135deg at             7px  50%,currentColor 90deg,#0000 0);
  background-position: 0 0;
  background-size: calc(3*100%/4) 100%;
  background-repeat: repeat-x;
  animation: l9 2s infinite linear;

  
}
@keyframes l9 {
    100% {background-position: -300% 0}
}

</style>
