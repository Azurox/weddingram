<template>
  <div>
    {{ event }}
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