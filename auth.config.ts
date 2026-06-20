import type { NextAuthConfig } from 'next-auth';

const ADMIN_EMAILS = ['prabhakar@cubelelo.com'];

/**
 * Edge-safe Auth.js config — no DB adapter, no Node-only providers.
 * Shared by the full server config (lib/auth.ts) and by middleware.ts.
 *
 * Everything here must run on the Edge runtime: token-only logic, no
 * mongoose/mongodb/bcrypt imports.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [], // real providers are added in lib/auth.ts (Node runtime)
  callbacks: {
    session({ session, token }: any) {
      if (token) {
        session.user.id     = token.sub ?? '';
        session.user.role   = (token.role   as string)        ?? 'user';
        session.user.userId = (token.userId as string | null) ?? null;
        if (token.name)    session.user.name  = token.name    as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
    // Gate /admin and /compete/admin to admins; non-admins redirect to signIn.
    authorized({ auth, request: { nextUrl } }: any) {
      const path = nextUrl.pathname;
      const needsAdmin = path.startsWith('/admin') || path.startsWith('/compete/admin');
      if (!needsAdmin) return true;
      const user = auth?.user as { role?: string; email?: string } | undefined;
      return user?.role === 'admin' || (!!user?.email && ADMIN_EMAILS.includes(user.email));
    },
  },
} satisfies NextAuthConfig;
