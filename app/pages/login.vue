<template>
  <div>
    <form @submit.prevent="login">
      <div>
        <label for="password">Password:</label>
        <input id="password" v-model="password" type="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script lang="ts" setup>
const password = ref("");

function login() {
  // verify master password
}
</script>
