import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Edge middleware using the adapter-free config. The `authorized` callback in
// auth.config.ts decides access; non-admins on matched routes are redirected to
// the sign-in page.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/admin', '/admin/:path*', '/compete/admin', '/compete/admin/:path*'],
};
