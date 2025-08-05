<template>
  <div class="flex flex-col w-full min-h-[100svh]">
    <main class="flex w-full flex-1 ">
      <slot />
    </main>
    <event-navigation-bar class="sticky bottom-0 right-0 left-0" />
  </div>
</template>

<style scoped>
main {
  background: radial-gradient(900px 600px at 85% -10%, rgba(201, 167, 76, 0.10), transparent 55%),
    radial-gradient(900px 700px at -10% 105%, rgba(201, 167, 76, 0.06), transparent 60%),
    #fbfaf7
}
</style>