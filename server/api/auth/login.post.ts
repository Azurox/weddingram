import z from "zod"

const loginRequestSchema = z.object({
  password: z.string().max(255),
})

export default defineEventHandler(async (event) => {
  const { password } = await readValidatedBody(event, body => loginRequestSchema.parse(body))

  const config = useRuntimeConfig(event)

  console.log('Attempting login with password')
  console.log(config.masterPassword)

  if (password !== config.masterPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    })
  }


  await setUserSession(event, {
    loggedInAt: new Date(),
    user: { },
    secure: {
      isAdmin: true,
    }
  })

  setResponseStatus(event, 204)
})
