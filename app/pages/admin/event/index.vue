<template>
  <div>
    <div><button @click="toggleCreationDialog">create</button></div>
    <AdminEventList v-if="events" :events="events" />
    <dialog ref="creationDialog">
      <AdminEventCreationForm />
    </dialog>
  </div>
</template>

<script lang="ts" setup>
const creationDialog = useTemplateRef('creationDialog');
const { data: events } = await useFetch('/api/events') 


function toggleCreationDialog() {
  if (creationDialog.value?.open) {
    creationDialog.value.close();
  } else {
    creationDialog.value?.showModal();
  }
}

</script>
