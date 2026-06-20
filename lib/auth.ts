import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

const ADMIN_EMAILS = ['prabhakar@cubelelo.com'];

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: process.env.MONGODB_URI ? MongoDBAdapter(clientPromise) : undefined,

  // JWT always — required for CredentialsProvider
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: { prompt: 'select_account' },
      },
    }),

    // ── Email + password login (production) ──────────────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.toLowerCase().trim();
        const password = (credentials?.password as string | undefined);

        if (!email || !password) return null;

        try {
          const { connectDB } = await import('@/lib/mongoose');
          const { User }      = await import('@/lib/models/User');
          await connectDB();

          // password field is excluded by default (select: false) — re-add it
          const user = await User.findOne({ email }).select('+password');
          if (!user || !user.password) return null;

          const bcrypt = await import('bcryptjs');
          const valid  = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          const fullName = [user.name?.firstName, user.name?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();

          return {
            id:      user._id.toString(),
            email:   user.email,
            name:    fullName || user.email,
            image:   user.profilePicture ?? null,
            role:    user.role ?? 'user',
            userId:  user.userId ?? null,
          };
        } catch (err) {
          console.error('[auth] credentials authorize error:', err);
          return null;
        }
      },
    }),

    // ── Dev sandbox — one-click login (dev only) ─────────────────────────────
    CredentialsProvider({
      id: 'dev-bypass',
      name: 'Dev Bypass',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (process.env.NEXTAUTH_DEV_BYPASS !== 'true') return null;
        const email   = (credentials?.email as string) ?? 'prabhakar@cubelelo.com';
        const isAdmin = ADMIN_EMAILS.includes(email);
        return {
          id:     `dev-${email}`,
          name:   isAdmin ? 'Prabhakar (Admin)' : 'Dev Athlete',
          email,
          image:  `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          role:   isAdmin ? 'admin' : 'user',
          userId: isAdmin ? 'CL0001' : 'CL0002',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // First sign-in — enrich token from provider result
        token.id     = user.id;
        token.role   = (user as any).role   ?? 'user';
        token.userId = (user as any).userId ?? null;
      }

      // After OAuth sign-in: pull role + userId from existing Cubelelo user collection
      if (account?.type === 'oauth' && process.env.MONGODB_URI) {
        try {
          const { connectDB } = await import('@/lib/mongoose');
          const { User }      = await import('@/lib/models/User');
          await connectDB();
          const dbUser = await User.findOne({ email: token.email?.toLowerCase() });
          if (dbUser) {
            token.role   = dbUser.role   ?? 'user';
            token.userId = dbUser.userId ?? null;
            // Handle both legacy flat-string name ("Prabhakar Patel")
            // and new object format ({ firstName, lastName })
            if (dbUser.name) {
              if (typeof (dbUser.name as any) === 'string') {
                token.name = (dbUser.name as any as string).trim() || token.name;
              } else {
                const n = dbUser.name as { firstName?: string; lastName?: string };
                const full = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
                token.name = full || token.name;
              }
            }
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
        session.user.id     = token.sub ?? '';
        session.user.role   = (token.role   as string)        ?? 'user';
        session.user.userId = (token.userId as string | null) ?? null;
        // Sync name/image enriched from DB
        if (token.name)    session.user.name  = token.name    as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
});
