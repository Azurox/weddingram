<template>
  <div>
    <div>
      <NuxtLink :to="`/event/${uuid}/upload`">
        Upload
      </NuxtLink>
      <NuxtLink :to="`/event/${uuid}/favorite`">
        Favorite
      </NuxtLink>
    </div>
    {{ event }}

    <div>
      <event-picture-thumbnail-list/>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'guest-registration'
})

const { uuid } = useRoute().params as { uuid: string };
const { data: event } = await useFetch(`/api/events/${uuid}`)

</script>

<style></style>