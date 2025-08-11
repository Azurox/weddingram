<template>
  <div class="menu-holder flex border-t border-t-almond-200 bg-white shadow-xl">
    <menu class="flex gap-6 items-center justify-between max-w-96 w-full mx-auto px-6">
      <li>
        <NuxtLink :to="`/event/${uuid}/`" class="py-3 px-4 flex items-center justify-center group relative" active-class="active" @click="dismissUploadNotification">
          <svg class="size-7 text-neutral-600 group-[.active]:text-almond-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M4 21V9l8-6l8 6v12h-6v-7h-4v7z"/></svg>
          <span class="sr-only">Go to home</span>
          <span v-if="isUploadCompleted" class="block size-3 rounded-full absolute right-2 top-2 bg-gradient-to-b from-almond-300 via-almond-500 to-almond-700/20 shadow-lg shadow-black/60 border border-almond-800/10 before:content-[''] before:absolute before:inset-0.5 before:bg-gradient-to-b before:from-white/60 before:to-transparent before:rounded-full"/>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink :to="`/event/${uuid}/upload`" class="py-3 px-4 flex items-center justify-center group" active-class="active">
          <svg class="size-7 text-neutral-600 group-[.active]:text-almond-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 14 14"><!-- Icon from Streamline by Streamline - https://creativecommons.org/licenses/by/4.0/ --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v6M4 7h6"/><rect width="13" height="13" x=".5" y=".5" rx="3"/></g></svg>
          <span class="sr-only">Go to upload new pictures</span>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink :to="`/event/${uuid}/favorite`" class="py-3 px-4 flex items-center justify-center group" active-class="active">
          <svg class="size-7 text-neutral-600 group-[.active]:text-almond-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Google Material Icons by Material Design Authors - https://github.com/material-icons/material-icons/blob/master/LICENSE --><path fill="currentColor" d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>
          <span class="sr-only">Go to favorite</span>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink :to="`/event/${uuid}/settings`" class="py-3 px-4 flex items-center justify-center group" active-class="active">
          <svg class="size-7 text-neutral-600 group-[.active]:text-almond-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from MingCute Icon by MingCute Design - https://github.com/Richard9394/MingCute/blob/main/LICENSE --><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M14.035 2.809c.37-.266.89-.39 1.401-.203a10 10 0 0 1 2.982 1.725c.417.35.57.861.524 1.313c-.075.753.057 1.48.42 2.106c.32.557.802.997 1.39 1.307l.225.11c.414.187.782.576.875 1.113a10 10 0 0 1 0 3.44c-.083.484-.39.847-.753 1.051l-.122.063c-.69.31-1.254.79-1.616 1.416c-.362.627-.494 1.353-.419 2.106c.045.452-.107.964-.524 1.313a10 10 0 0 1-2.982 1.725a1.51 1.51 0 0 1-1.4-.203C13.42 20.75 12.723 20.5 12 20.5s-1.42.249-2.035.691a1.51 1.51 0 0 1-1.401.203a10 10 0 0 1-2.982-1.725a1.51 1.51 0 0 1-.524-1.313c.075-.753-.058-1.48-.42-2.106a3.4 3.4 0 0 0-1.39-1.307l-.225-.11a1.51 1.51 0 0 1-.875-1.113a10 10 0 0 1 0-3.44c.083-.484.39-.847.753-1.051l.122-.062c.69-.311 1.254-.79 1.616-1.417c.361-.626.494-1.353.419-2.106a1.51 1.51 0 0 1 .524-1.313a10 10 0 0 1 2.982-1.725a1.51 1.51 0 0 1 1.4.203c.615.442 1.312.691 2.036.691s1.42-.249 2.035-.691m.957 1.769c-.866.57-1.887.922-2.992.922s-2.126-.353-2.992-.922A8 8 0 0 0 7.068 5.7c.06 1.033-.145 2.093-.697 3.05c-.553.956-1.368 1.663-2.293 2.128a8 8 0 0 0 0 2.242c.925.465 1.74 1.172 2.293 2.13c.552.955.757 2.015.697 3.048a8 8 0 0 0 1.94 1.123c.866-.57 1.887-.922 2.992-.922s2.126.353 2.992.922a8 8 0 0 0 1.94-1.122c-.06-1.034.145-2.094.697-3.05c.552-.957 1.368-1.664 2.293-2.13a8 8 0 0 0 0-2.24c-.925-.466-1.74-1.173-2.293-2.13c-.552-.956-.757-2.016-.697-3.05a8 8 0 0 0-1.94-1.122ZM12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8m0 2a2 2 0 1 0 0 4a2 2 0 0 0 0-4"/></g></svg>
          <span class="sr-only">Go to settings</span>
        </NuxtLink>
      </li>
    </menu>
  </div>
</template>

<script lang="ts" setup>
const { uuid } = useRoute().params as { uuid: string };
const { isUploadCompleted } = useGlobalPictureUploader()

function dismissUploadNotification() {
  if(isUploadCompleted.value) {
    isUploadCompleted.value = false
  }
}
</script>

<style scoped>
.menu-holder {
  box-shadow: -1px -8px 26px -10px rgba(204, 204, 204, 0.75);
}

</style>