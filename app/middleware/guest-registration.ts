export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()

    if (!loggedIn.value) {
    return navigateTo('/event/' + useRoute().params.uuid + '/register')
  }
})