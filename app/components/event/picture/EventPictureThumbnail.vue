<template>
  <div>
    <img :src="picture.url" class="w-full aspect-square">
  </div>
</template>

<script lang="ts" setup>
import type { UploadedPicture } from '~~/server/api/events/[id]/pictures/index.get';
import type { SerializeObject } from 'nitropack'

const {picture} = defineProps<{
  picture: SerializeObject<UploadedPicture>
}>()

</script>
