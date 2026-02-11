import { bot } from './bot';
import { handleCleanup } from './cleanup';
import { env } from './config';
import { logger } from './utils/logger';

const CLEANUP_INTERVAL = env.sessionsCleanupMs;

const startBot = async () => {
  try {
    logger.start('Starting the bot...');

    const cleanupTaskId = setInterval(async () => {
      try {
        handleCleanup();
      } catch (err) {
        logger.error('Error during session cleanup:', err);
      }
    }, CLEANUP_INTERVAL);

    await bot.start({
      onStart: (info) => {
        logger.success(`@${info.username} is up and running.`);
      },
    });

    process.once("SIGINT", () => clearInterval(cleanupTaskId));
    process.once("SIGTERM", () => clearInterval(cleanupTaskId));
  } catch (error) {
    logger.fatal('Critical error during startup:', error);
    process.exit(1);
  }
}

startBot();