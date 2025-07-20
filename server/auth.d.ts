declare module '#auth-utils' {
  interface User {
    id?: string;
  }

  interface UserSession {
    loggedInAt: Date;
  }

  interface SecureSessionData { 
    isAdmin: boolean;
  }
 
}

export {}