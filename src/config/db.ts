import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

// Cache the promise so Vercel serverless functions reuse the same connection
// across warm invocations instead of re-connecting on every request.
let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  mongoose.set('autoIndex', !config.isProd);

  // Already connected — nothing to do.
  if (mongoose.connection.readyState === 1) return;

  // Connection already in progress — wait for it.
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  try {
    connectionPromise = mongoose.connect(config.mongoUrl, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    await connectionPromise;
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    connectionPromise = null; // allow retry on next request
    logger.error('MongoDB connection failed', err);
    throw err;
  }
};

export const disconnectDB = () => {
  connectionPromise = null;
  return mongoose.disconnect();
};
