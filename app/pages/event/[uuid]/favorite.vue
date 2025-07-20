<template>
  <div>
    <div>
      <NuxtLink :to="`/event/${uuid}/upload`">
        Upload
      </NuxtLink>
      <NuxtLink :to="`/event/${uuid}/favorite`">
        Favorite
      </NuxtLink>
      <event-picture-thumbnail-favorite-list/>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'guest-registration'
})

const { uuid } = useRoute().params as { uuid: string };

</script>

<style></style>