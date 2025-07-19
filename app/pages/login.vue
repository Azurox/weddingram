<template>
  <div>
    <form @submit.prevent="login">
      <div>
        <label for="password">Password:</label>
        <input id="password" v-model="password" type="password" required autocomplete="current-password">
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script lang="ts" setup>
const { fetch: fetchUserSession } = useUserSession()

const password = ref("");
const isLoading = ref(false);
const hasError = ref(false);

async function login() {
  try {
    isLoading.value = true;
    hasError.value = false;

    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value },
    })
    await fetchUserSession()
  } catch (error) {
    hasError.value = true;
    console.error("Login failed:", error);
  } finally {
    isLoading.value = false;
  }
}
</script>
