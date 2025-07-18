<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"/>
</template>

<script lang="ts" setup>
const _events =  await useAsyncData('events', () => {
  return useFetch('/api/events')
})
</script>
