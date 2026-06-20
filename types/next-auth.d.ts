import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      userId?: string | null;
    };
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
