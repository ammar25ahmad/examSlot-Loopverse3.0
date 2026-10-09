import app from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import logger from './utils/logger.js';

async function start() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`ExamSlot API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    if (!env.isEmailConfigured) {
      logger.warn('Transactional email is disabled (Resend not configured). Account emails will report as unavailable.');
    }
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down…`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err?.stack || err);
  process.exit(1);
});

start().catch((err) => {
  logger.error('Failed to start ExamSlot API:', err?.stack || err);
  process.exit(1);
});
