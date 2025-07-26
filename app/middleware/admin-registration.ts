export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, session } = useUserSession()

    if (!loggedIn.value || session.value?.user?.isAdmin !== true) {
    return navigateTo('/login')
  }
})