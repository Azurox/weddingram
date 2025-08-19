<script lang="ts" setup>
definePageMeta({
  middleware: 'guest-registration',
  layout: 'application',
})

const { uuid } = useRoute().params as { uuid: string }
const { data: event } = await useFetch(`/api/events/single/${uuid}`, { key: `event:${uuid}:details` })

const { share } = useShare()

function shareEventUrl() {
  share({
    title: `Join the event: ${event.value?.name}`,
    url: event.value?.eventUrl,
  })
}
</script>

<template>
  <div class="w-full">
    <header class="p-5 border-b border-b-almond-700/20">
      <UiContainer class="flex items-center justify-between gap-4">
        <h1 class="font-logo text-2xl/normal tracking-wide">
          Settings
        </h1>
      </UiContainer>
    </header>
    <div class="flex flex-col gap-4">
      <div class="bg-almond-50 px-2 py-3 border-b border-b-almond-700/20">
        <UiContainer>
          <h2 class="font-medium">
            General
          </h2>
        </UiContainer>
      </div>
      <UiContainer class="w-full">
        <menu class="flex flex-col divide-y divide-almond-100">
          <li class="flex-col flex items-start gap-1 px-4 py-4 first:pt-0 last:pb-0">
            <button class="bg-white border border-almond-200 rounded-lg p-2 text-sm font-medium text-almond-700 transition-all active:scale-95" type="button" @click="shareEventUrl">
              Copy invitation link
            </button>
            <p class="text-neutral-700 text-sm max-w-prose">
              Invite others by sharing the event link.
            </p>
          </li>
          <li class="flex-col flex items-start gap-1 px-4 py-4 first:pt-0 last:pb-0">
            <form action="/api/auth/logout" method="post" class="contents">
              <button class="bg-white border border-almond-200 rounded-lg p-2 text-sm font-medium text-almond-700 transition-all active:scale-95" type="submit">
                Leave event
              </button>
            </form>
            <p class="text-neutral-700 text-sm max-w-prose">
              Leaving the event will disconnect you from this event and you will need to register again. Your uploaded picture will remain in the event.
            </p>
          </li>
        </menu>
      </UiContainer>
    </div>
  </div>
</template>
