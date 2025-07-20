<template>
  <div>
    <div>
      <NuxtLink :to="`/event/${uuid}/`">
        ⬅️
      </NuxtLink>
    </div>
    <event-upload-form />
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'guest-registration'
})

const { uuid } = useRoute().params as { uuid: string };

</script>

<style>

</style>