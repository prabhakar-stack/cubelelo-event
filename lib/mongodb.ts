/**
 * MongoDB native client — used by @auth/mongodb-adapter for NextAuth session storage.
 * Caches the client across hot-reloads in development.
 */
import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI ?? '';
const options: MongoClientOptions = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!uri) {
  clientPromise = Promise.reject(
    new Error('[mongodb] MONGODB_URI is not defined — set it in your environment variables.')
  );
  clientPromise.catch(() => {});
} else if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise as Promise<MongoClient>;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
