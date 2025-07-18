import z from "zod"

const loginRequestSchema = z.object({
  password: z.string().max(255),
})

export default defineEventHandler(async (event) => {
  const {password} = await readValidatedBody(event, body => loginRequestSchema.parse(body))

  const config = useRuntimeConfig(event)
  
  if (!await verifyPassword(password, config.masterPassword)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    })
  }
  
  await setUserSession(event, {
    loggedInAt: new Date()
  })
  
  setResponseStatus(event, 204)
})
