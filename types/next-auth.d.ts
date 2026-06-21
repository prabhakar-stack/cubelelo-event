import { DefaultSession } from 'next-auth';

// Single source of truth for NextAuth type augmentation.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      userId?: string | null;
    } & DefaultSession['user'];
  }
  interface User {
    role?: string;
    userId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    userId?: string | null;
  }
}
