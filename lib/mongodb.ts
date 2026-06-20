/**
 * MongoDB native client — used by @auth/mongodb-adapter for NextAuth session storage.
 * Caches the client across hot-reloads in development.
 *
 * Fails gracefully (returns a rejected promise) when MONGODB_URI is unset
 * so the module can be imported without crashing the Lambda cold-start.
 */

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI ?? '';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!uri) {
  // Return a promise that rejects on first use rather than throwing at import time.
  clientPromise = Promise.reject(
    new Error('[mongodb] MONGODB_URI is not defined — set it in your environment variables.')
  );
  // Suppress unhandledRejection for this stub promise
  clientPromise.catch(() => {});
} else if (process.env.NODE_ENV === 'development') {
  // In dev, reuse the client across module hot-reloads
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
