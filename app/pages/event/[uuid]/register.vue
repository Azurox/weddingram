<script lang="ts" setup>
const { uuid } = useRoute().params as { uuid: string }
const { data: event } = await useFetch(`/api/events/single/${uuid}`, { key: `event:${uuid}:details` })
const { fetch: fetchUserSession } = useUserSession()

const registerError = ref<string>()

const form = reactive({
  name: '',
})
const isLoading = ref(false)

async function registerToEvent() {
  isLoading.value = true
  try {
    await $fetch(`/api/events/single/${uuid}/register`, {
      method: 'POST',
      body: { nickname: form.name },
    })

    await fetchUserSession()

    await navigateTo(`/event/${uuid}/`)
  }
  catch (error) {
    registerError.value = 'Registration failed. Please try again.'
    console.error('Registration failed:', error)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full h-full bg-merino-50 sm:flex sm:items-center sm:justify-center sm:p-4 sm:h-auto">
    <div v-if="event" class="w-full h-full max-w-lg sm:h-auto">
      <div class="bg-white flex flex-col h-full sm:h-auto sm:rounded-2xl sm:shadow-lg overflow-hidden">
        <div class="relative h-[30svh] overflow-hidden">
          <img v-if="event.imageUrl" :src="event.imageUrl" alt="" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

          <div class="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 class="text-5xl font-logo mb-3 text-white drop-shadow-lg">
              Weddingram
            </h1>
            <div class="flex justify-center mb-4">
              <span class="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                Private Event
              </span>
            </div>
            <h2 class="text-2xl font-logo text-white/90 drop-shadow-md">
              {{ event.shortName }}
            </h2>
          </div>
        </div>

        <div class="p-8 flex-1 flex flex-col gap-12">
          <div class="flex flex-col gap-6">
            <p class="text-lg text-merino-700 font-medium leading-relaxed">
              You've been invited to a private Instagram.
            </p>
            <ul class="flex flex-col gap-1 list-inside text-merino-600">
              <li>Share pictures you take during the wedding</li>
              <li>See other guest pictures</li>
              <li>Favorite and download picture you like</li>
              <li>You'll have 3 weeks to upload your pictures</li>
            </ul>
          </div>

          <form class="mt-auto sm:mt-0" @submit.prevent="registerToEvent">
            <fieldset class="space-y-4" :disabled="isLoading">
              <div>
                <label for="name" class="block text-sm font-medium text-merino-700 mb-2">
                  Enter your name
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  autocomplete="name"
                  autocapitalize="on"
                  autocorrect="off"
                  required
                  placeholder="Rebecca B."
                  class="w-full px-4 py-3 border border-merino-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-almond-500 focus:border-transparent transition-all"
                  :disabled="isLoading"
                >
              </div>

              <div v-if="registerError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-700 text-sm">
                  {{ registerError }}
                </p>
              </div>

              <button
                type="submit"
                class="group w-full relative py-4 bg-almond-500 text-white rounded-xl font-medium text-lg tracking-wide transition-all duration-200
                hover:bg-almond-600 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
              >
                <div class="absolute inset-0 flex items-center justify-center">
                  <ui-loading-icon v-if="isLoading" class="w-5 h-5" />
                </div>
                <span class="transition-opacity group-disabled:opacity-0">Join the celebration</span>
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}

ul {
  list-style: url(assets/images/icons/diamond.svg) inside;

  li::marker {
    font-size: 26px;
    line-height: 0;
  }
}
</style>
