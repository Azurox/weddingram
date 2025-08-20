<script lang="ts" setup>
const { uuid } = useRoute().params as { uuid: string }
const { data: event } = await useFetch(`/api/events/single/${uuid}`, { key: `event:${uuid}:details` })
</script>

<template>
  <div v-if="event">
    <ui-container>
      <img
        v-if="event?.imageUrl"
        :src="event.imageUrl"
        alt="Event Image"
        class="w-full h-64 object-cover rounded-lg mb-4"
      >
    </ui-container>
  </div>
</template>

<style>

</style>
