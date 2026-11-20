import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  mongoose.set('autoIndex', !config.isProd);

  try {
    await mongoose.connect(config.mongoUrl, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 8000,  // fail fast — 8s instead of 30s
      connectTimeoutMS: 8000,
      socketTimeoutMS: 30000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.error('MongoDB connection failed', err);
    throw err;
  }
};

export const disconnectDB = () => mongoose.disconnect();
