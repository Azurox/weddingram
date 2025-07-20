export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

    if (!loggedIn.value || !user.value?.id) {
    return navigateTo('/event/' + to.params.uuid + '/register')
  }
})