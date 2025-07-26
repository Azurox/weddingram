<template>
  <div class="grid grid-cols-3 gap-4">
    <article v-for="event in events" :key="event.id" class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex">
      <NuxtLink :to="{path: `/admin/event/single/${event.id}`}" class="h-full w-full">
        <img
        :src="event.imageUrl ?? ''" class="w-full max-h-52">
        <div class="p-4 border-t border-almond-200">
          <h2>
            {{ event.name }}
          </h2>
          <div>
            Starts
            <NuxtTime  :datetime="event.startDate" class="text-sm text-merino-500" />
          </div>
          <div>
            Ends
            <NuxtTime  :datetime="event.endDate" class="text-sm text-merino-500" />
          </div>
        </div>
      </NuxtLink>
    </article>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  events: Array<{
    id: string;
    name: string;
    shortName: string;
    startDate: string;
    endDate: string;
    bucketUri?: string;
    bucketType: 'filesystem' | 'R2';
    imageUrl: string | null;
  }>;
}>();

</script>
