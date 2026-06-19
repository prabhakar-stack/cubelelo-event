// Prisma v7 requires dotenv to be explicitly loaded in this file.
// Next.js automatically loads .env.local at runtime, but the Prisma CLI runs standalone.
// We load .env.local manually here so CLI commands (generate, db push) pick it up.
import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

// Load .env.local first (Next.js convention), then fall back to .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;

// ─── Prisma v7 Config ─────────────────────────────────────────────────────────
// datasource.url must be set here (not in schema.prisma) in Prisma v7.
// If DATABASE_URL is not set, commands that require a connection (db push, migrate)
// will fail — but `prisma generate` will still work (it only needs the schema).
//
// Steps to connect your database:
//   1. Set DATABASE_URL in .env.local
//   2. npx prisma generate   — regenerate types
//   3. npx prisma db push    — push schema to your database

export default defineConfig({
  schema: './prisma/schema.prisma',
  ...(databaseUrl
    ? { datasource: { url: databaseUrl } }
    : {}),
});
