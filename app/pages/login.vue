<script lang="ts" setup>
const { fetch: fetchUserSession } = useUserSession()
const router = useRouter()
const password = ref('')
const isLoading = ref(false)
const hasError = ref(false)

async function login() {
  try {
    isLoading.value = true
    hasError.value = false
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value },
    })
    await fetchUserSession()
    router.push({ path: '/admin/event/' })
  }
  catch (error) {
    hasError.value = true
    console.error('Login failed:', error)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full h-full bg-merino-100 flex items-center justify-center">
    <div class="w-full max-w-xl">
      <div class="p-6 rounded-lg w-full flex flex-col gap-16">
        <div class="flex flex-col gap-2">
          <h1 class="text-8xl font-logo">
            Weddingram
          </h1>
          <ul class="flex gap-2">
            <li>
              <a class="font-bold bg-almond-500 text-white px-2 py-1 rounded-2xl text-xs flex gap-1 items-center">
                <span>docs</span>
              </a>
            </li>
            <li>
              <a class="font-bold bg-almond-500 text-white px-2 py-1 rounded-2xl text-xs">@azuron07</a>
            </li>
          </ul>
        </div>
        <form class="contents" @submit.prevent="login">
          <fieldset :disabled="isLoading" class="contents">
            <div class="flex flex-col gap-2">
              <label for="password" class="font-medium text-sm text-merino-500">Master password</label>
              <input
                id="password" v-model="password" type="password" required autocomplete="current-password"
                class="px-6 text-merino-950 tracking-widest py-6 text-2xl w-full bg-white rounded-xl border border-merino-400 focus:outline-merino-700"
              >
            </div>
            <div class="flex items-center justify-center">
              <button
                type="submit" class="px-8 w-full max-w-sm py-6 bg-almond-500 rounded-3xl font-medium text-white text-xl tracking-wide border-transparent border transition-colors
              hover:bg-white hover:text-merino-950 hover:border-almond-500
              active:bg-white active:text-merino-950 active:border-almond-500"
              >
                Login
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</template>
