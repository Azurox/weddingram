<template>
  <div>
    <div>
      {{ event }}
    </div>
    <div>
      <form @submit.prevent="deleteEvent">
        <fieldset>
          <button type="submit">Delete Event</button>
        </fieldset>
      </form>
      <NuxtLink :to="`/event/${uuid}/`">
        Go to guest event page
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { uuid } = useRoute().params as { uuid: string };
const {data: event} = await useFetch(`/api/events/${uuid}`)
const isLoadingDelete = ref(false);

async function deleteEvent() {
  isLoadingDelete.value = true;
  try {
    await $fetch(`/api/events/${uuid}/erase`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error("Failed to delete event:", error);
  } finally {
    isLoadingDelete.value = false;
  }
}
</script>
