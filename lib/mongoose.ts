/**
 * Mongoose connection — used for all Cubelelo data models.
 * Caches the connection across Next.js hot-reloads in development.
 *
 * Fails gracefully when MONGODB_URI is unset so the module can be
 * imported without crashing the Lambda cold-start.
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? '';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('[mongoose] MONGODB_URI is not defined — set it in your environment variables.');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
