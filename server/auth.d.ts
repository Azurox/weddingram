declare module '#auth-utils' {
  interface User {
    id: string;
  }

  interface UserSession {
    loggedInAt: Date;
  }

  /* Not used for now
    interface SecureSessionData { }
  */
}

export {}