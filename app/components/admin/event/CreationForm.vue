<script lang="ts" setup>
import type { EventBucketType } from '~~/server/database/schema/event-schema'

const { handleFileInput, files: coverImage } = useFileStorage()

const isLoading = ref(false)
const form = reactive({
  name: '',
  shortName: '',
  startDate: '',
  endDate: '',
  bucketUri: '',
  bucketType: 'filesystem' satisfies EventBucketType,
})

const bucketTypeOptions = [
  { value: 'filesystem', label: 'Filesystem', disabled: false },
  { value: 'R2', label: 'R2', disabled: true }, // R2 is not implemented yet
] satisfies { value: EventBucketType, label: string, disabled: boolean }[]

async function createEvent() {
  const _result = await $fetch('/api/events/create', {
    method: 'POST',
    body: {
      name: form.name,
      shortName: form.shortName,
      image: coverImage.value[0],
      bucketUri: form.bucketUri,
      bucketType: form.bucketType,
      startDate: form.startDate,
      endDate: form.endDate,
    },
  })

  // Todo | navigate to the event page
}
</script>

<template>
  <form @submit.prevent="createEvent">
    <fieldset :disabled="isLoading">
      <div>
        <label for="name">Event Name:</label>
        <input id="name" v-model="form.name" type="text" required>
      </div>
      <div>
        <label for="shortName">Short Name:</label>
        <input id="shortName" v-model="form.shortName" type="text" required>
      </div>
      <div>
        <label for="startDate">Start Date:</label>
        <input id="startDate" v-model="form.startDate" type="date" required>
      </div>
      <div>
        <label for="endDate">End Date:</label>
        <input id="endDate" v-model="form.endDate" type="date" required>
      </div>
      <div>
        <label for="bucketType">Bucket Type:</label>
        <select id="bucketType" v-model="form.bucketType">
          <option v-for="option in bucketTypeOptions" :key="option.value" :value="option.value" :disabled="option.disabled">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div v-if="form.bucketType === 'R2'">
        <label for="bucketUri">Bucket URI:</label>
        <input id="bucketUri" v-model="form.bucketUri" type="text">
      </div>
      <div>
        <label for="coverImage">Cover Image:</label>
        <input id="coverImage" type="file" @change="handleFileInput">
      </div>
      <input type="submit" value="Create Event">
    </fieldset>
  </form>
</template>

<style>

</style>
