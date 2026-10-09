import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

let txnSupported = false;

/**
 * Whether the connected MongoDB deployment supports multi-document
 * transactions (i.e. it is a replica set / Atlas cluster, not a standalone
 * local mongod). Services use this to choose between real transactions and
 * concurrency-safe single-document atomic updates.
 */
export function supportsTransactions() {
  return txnSupported;
}

async function detectTransactionSupport() {
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    txnSupported = Boolean(hello.setName);
  } catch {
    txnSupported = false;
  }
  logger.info(
    `MongoDB transactions: ${txnSupported ? 'supported (replica set)' : 'not supported (standalone) — using atomic updates'}`
  );
}

export async function withTransaction(fn) {
  if (!txnSupported) return fn(null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function connectDatabase(uri = env.MONGODB_URI) {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });

  logger.info(`MongoDB connected: ${mongoose.connection.name}`);
  await detectTransactionSupport();
  return mongoose.connection;
}

/**
 * Serverless-safe connection guard. In production the app is served by a
 * single function instance that imports `app.js` directly (no `server.js`
 * startup), so the connection is established lazily on the first request and
 * cached on `globalThis` to be reused across invocations of the same instance.
 */
export async function ensureDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const cache = globalThis.__examslotDbConnection;
  if (cache) return cache;

  const promise = connectDatabase().catch((err) => {
    if (globalThis.__examslotDbConnection === promise) {
      globalThis.__examslotDbConnection = null;
    }
    throw err;
  });
  globalThis.__examslotDbConnection = promise;
  return promise;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export default connectDatabase;
