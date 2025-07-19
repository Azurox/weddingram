<template>
  <div class="grid grid-cols-3 gap-4">
    <article v-for="event in events" :key="event.id">
      <NuxtLink :to="{path: `/admin/event/single/${event.id}`}">
        {{ event }}
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
  }>;
}>();

</script>
