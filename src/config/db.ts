import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  // Build indexes automatically in development; in production indexes should be
  // created by a migration step so app boots are not blocked by index builds.
  mongoose.set('autoIndex', !config.isProd);

  await mongoose.connect(config.mongoUrl, { maxPoolSize: 20 });
  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

export const disconnectDB = () => mongoose.disconnect();
