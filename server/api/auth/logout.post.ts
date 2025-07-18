export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await clearUserSession(event)

  setResponseStatus(event, 204)
})
