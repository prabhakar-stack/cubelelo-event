import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

// ─── Admin emails (full access) ───────────────────────────────────────────────
const ADMIN_EMAILS = ['prabhakar@cubelelo.com'];

// ─── Dev Bypass User ──────────────────────────────────────────────────────────
// When NEXTAUTH_DEV_BYPASS=true, clicking "Dev Bypass" logs in as admin.
const DEV_BYPASS_USER = {
  id: 'dev-bypass-user',
  name: 'Dev Admin (Prabhakar)',
  email: 'prabhakar@cubelelo.com',
  image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=cubelelo',
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use MongoDB adapter when MONGODB_URI is provided; else JWT-only (dev bypass)
  adapter: process.env.MONGODB_URI ? MongoDBAdapter(clientPromise) : undefined,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),

    // Dev bypass — enabled with NEXTAUTH_DEV_BYPASS=true
    CredentialsProvider({
      id: 'dev-bypass',
      name: 'Dev Bypass',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (process.env.NEXTAUTH_DEV_BYPASS !== 'true') return null;
        const email = (credentials?.email as string) || DEV_BYPASS_USER.email;
        return {
          ...DEV_BYPASS_USER,
          email,
          role: ADMIN_EMAILS.includes(email) ? 'ADMIN' : 'ATHLETE',
        };
      },
    }),
  ],

  session: {
    strategy: process.env.MONGODB_URI ? 'database' : 'jwt',
  },

  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        const email = session.user.email ?? '';

        // ── database strategy (MongoDB connected) ──
        if (user) {
          session.user.id = user.id;
          session.user.role = ADMIN_EMAILS.includes(email)
            ? 'ADMIN'
            : ((user as any).role ?? 'ATHLETE');
        }

        // ── JWT strategy (dev bypass / no DB) ──
        if (token) {
          session.user.id = token.sub ?? 'dev-bypass-user';
          session.user.role = ADMIN_EMAILS.includes(email)
            ? 'ADMIN'
            : ((token.role as string) ?? 'ATHLETE');
        }
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        const email = (user as any).email ?? '';
        token.role = ADMIN_EMAILS.includes(email)
          ? 'ADMIN'
          : ((user as any).role ?? 'ATHLETE');
      }
      return token;
    },
  },

  events: {
    /**
     * Fires once when a user is created via OAuth for the first time.
     * Seeds the CL ID and role in our own User collection.
     */
    async createUser({ user }) {
      if (!process.env.MONGODB_URI) return;
      try {
        const { connectDB } = await import('@/lib/mongoose');
        const { User } = await import('@/lib/models/User');
        await connectDB();
        const role = ADMIN_EMAILS.includes(user.email ?? '') ? 'ADMIN' : 'ATHLETE';
        await User.findOneAndUpdate(
          { email: user.email },
          { $setOnInsert: { email: user.email }, $set: { name: user.name, image: user.image, role } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('[auth] createUser event error:', err);
      }
    },
  },

  pages: {
    signIn: '/',
    error: '/',
  },

  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-production',
});
