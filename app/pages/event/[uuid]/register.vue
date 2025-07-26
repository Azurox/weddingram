<template>
  <div>
    {{ event }}
    <form @submit.prevent="registerToEvent">
      <fieldset :disabled="isLoading">
        <div>
          <label for="name">Name</label>
          <input id="name" v-model="form.name" type="text" required>
        </div>
        <input type="submit" value="Join event">
      </fieldset>
    </form>
  </div>
</template>

<script lang="ts" setup>
const { uuid } = useRoute().params as { uuid: string };
const { data: event } = await useFetch(`/api/events/${uuid}`)
const registerError = ref<string>()
const { fetch: fetchUserSession } = useUserSession()


const form = reactive({
  name: '',
});
const isLoading = ref(false);

async function registerToEvent() {
  isLoading.value = true;
  try {
    await $fetch(`/api/events/single/${uuid}/register`, {
      method: 'POST',
      body: { nickname: form.name },
    });

    await fetchUserSession()

    await navigateTo(`/event/${uuid}/`);
  } catch (error) {
    registerError.value = "Registration failed. Please try again.";
    console.error("Registration failed:", error);
  } finally {
    isLoading.value = false;
  }
}

</script>

<style></style>