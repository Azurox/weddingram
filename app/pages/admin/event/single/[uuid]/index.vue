<template>
  <div class="bg-merino-100 w-full">
    <header class="max-w-3xl mx-auto p-4 w-full flex">
      <NuxtLink :to="`/admin/event/`" class="flex gap-1 items-center justify-center">
        <svg
xmlns="http://www.w3.org/2000/svg" width="16" height="16"
          viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
          <path
fill="currentColor"
            d="m7.825 13l4.9 4.9q.3.3.288.7t-.313.7q-.3.275-.7.288t-.7-.288l-6.6-6.6q-.15-.15-.213-.325T4.426 12t.063-.375t.212-.325l6.6-6.6q.275-.275.688-.275t.712.275q.3.3.3.713t-.3.712L7.825 11H19q.425 0 .713.288T20 12t-.288.713T19 13z" />
        </svg>
        <span class="">Go back</span>
      </NuxtLink>
    </header>
    <div v-if="event" class="w-full max-w-5xl mx-auto">
      <img :src="event.imageUrl ?? ''" class="w-full max-h-96 object-cover">
      <h1 class="text-3xl p-4">{{ event.name }}</h1>
      <div class="p-4">
        <dl class="grid grid-cols-2 gap-4">
          <div>
            <dt class="font-medium text-sm text-merino-500">Short Name</dt>
            <dd class="text-lg">{{ event.shortName }}</dd>
          </div>
          <div>
            <dt class="font-medium text-sm text-merino-500">Start Date</dt>
            <dd class="text-lg">
              <NuxtTime :datetime="event.startDate" />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-sm text-merino-500">End Date</dt>
            <dd class="text-lg">
              <NuxtTime :datetime="event.endDate" />
            </dd>
          </div>
        </dl>
      </div>
      <div class="px-4 flex flex-col gap-8">
        <section class="flex flex-col gap-4">
          <h2 class="text-xl font-medium">Action</h2>
          <div>
            <div class="">
              <span>URL</span>
              <NuxtLink :to="eventUrl" class="underline">
                Go to guest event page
              </NuxtLink>
            </div>
            <AdminEventQrCodeGenerator :event-url="eventUrl"/>
          </div>
        </section>
        <hr>
        <section class="flex flex-col gap-4">
          <h2 class="text-xl font-medium">Danger zone</h2>
          <ul class="flex flex-col gap-4">
            <li>
              <button class="px-2 py-1 bg-red-600 rounded-md text-white font-medium">Close event early</button>
              <p>This will update the end date and guest will be not able to upload pictures anymore but it's still
                possible to download them.</p>
            </li>
            <li>
              <form @submit.prevent="deleteEvent">
                <fieldset>
                  <button type="submit" class="px-2 py-1 bg-red-600 rounded-md text-white font-medium">Delete
                    Event</button>
                </fieldset>
              </form>
              <p>This action will also delete all pictures from the event.</p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'admin-registration'
})

const { uuid } = useRoute().params as { uuid: string };
const { data: event } = await useFetch(`/api/events/single/${uuid}`)
const isLoadingDelete = ref(false);

const url = useRequestURL()
const eventUrl = computed(() => {
  return url.origin + `/event/${uuid}`;
})


async function deleteEvent() {
  isLoadingDelete.value = true;
  try {
    await $fetch(`/api/events/single/${uuid}/erase`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error("Failed to delete event:", error);
  } finally {
    isLoadingDelete.value = false;
  }
}
</script>
