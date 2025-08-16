declare module '#auth-utils' {
  interface User {
    id?: string
    isAdmin: boolean
  }

  interface UserSession {
    loggedInAt: Date
  }
}

export {}
