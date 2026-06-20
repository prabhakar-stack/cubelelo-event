import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

const ADMIN_EMAILS = ['prabhakar@cubelelo.com'];

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: process.env.MONGODB_URI ? MongoDBAdapter(clientPromise) : undefined,

  // JWT always — required for CredentialsProvider (dev bypass)
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: { prompt: 'select_account' },
      },
    }),

    // Dev sandbox — one-click login without Google OAuth
    CredentialsProvider({
      id: 'dev-bypass',
      name: 'Dev Bypass',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (process.env.NEXTAUTH_DEV_BYPASS !== 'true') return null;
        const email = (credentials?.email as string) ?? 'prabhakar@cubelelo.com';
        const isAdmin = ADMIN_EMAILS.includes(email);
        return {
          id: `dev-${email}`,
          name: isAdmin ? 'Prabhakar (Admin)' : 'Dev Athlete',
          email,
          image: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          role: isAdmin ? 'admin' : 'user',
          userId: isAdmin ? 'CL0001' : 'CL0002',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // First sign-in — enrich token from DB
        token.id = user.id;
        token.role = (user as any).role ?? 'user';
        token.userId = (user as any).userId ?? null;
      }

      // After OAuth sign-in: pull role + userId from existing Cubelelo user collection
      if (account?.type === 'oauth' && process.env.MONGODB_URI) {
        try {
          const { connectDB } = await import('@/lib/mongoose');
          const { User } = await import('@/lib/models/User');
          await connectDB();
          const dbUser = await User.findOne({ email: token.email?.toLowerCase() });
          if (dbUser) {
            token.role = dbUser.role ?? 'user';
            token.userId = dbUser.userId ?? null;
            token.name = dbUser.name
              ? `${dbUser.name.firstName ?? ''} ${dbUser.name.lastName ?? ''}`.trim()
              : token.name;
            token.picture = dbUser.profilePicture ?? token.picture;
          }
          // Force admin for known admin emails
          if (ADMIN_EMAILS.includes(token.email ?? '')) token.role = 'admin';
        } catch (err) {
          console.error('[auth] jwt callback DB lookup error:', err);
        }
      }

        return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as string) ?? 'user';
        session.user.userId = (token.userId as string | null) ?? null;
        // Sync name/image enriched from DB
        if (token.name)    session.user.name  = token.name  as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
});
