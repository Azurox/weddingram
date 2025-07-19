import z from "zod"
import crypto from "node:crypto"

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

  const temporaryId = crypto.randomUUID()

  await setUserSession(event, {
    loggedInAt: new Date(),
    user: {
      id: temporaryId
    }
  })

  setResponseStatus(event, 204)
})
