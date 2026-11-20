import type { Server } from 'http';
import dns from 'node:dns';
import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { config } from './config/env';
import { logger } from './config/logger';

// Use Google DNS so MongoDB Atlas SRV records resolve in restricted networks.
dns.setServers(['8.8.8.8', '8.8.4.4']);

let server: Server | undefined;

const shutdown = (signal: string, exitCode = 0) => {
  logger.info(`${signal} received, shutting down gracefully`);
  const finish = async () => {
    await disconnectDB().catch(() => undefined);
    process.exit(exitCode);
  };
  if (server) server.close(() => void finish());
  else void finish();
  setTimeout(() => process.exit(exitCode || 1), 10_000).unref();
};

const start = async () => {
  await connectDB();
  server = app.listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port} (${config.env})`);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  shutdown('uncaughtException', 1);
});

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
