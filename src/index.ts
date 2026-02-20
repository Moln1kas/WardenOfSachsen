import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { env } from './config';
import { logger } from './utils/logger';
import { db } from './db';

const CLEANUP_INTERVAL = env.sessionsCleanupMs;

try {
  logger.log('Running migrations...');

  await migrate(db, { migrationsFolder: './drizzle' }); 

  logger.success('Migrations completed.');
} catch (error) {
  logger.error('Migration failed:', error);
  process.exit(1);
}

const startBot = async () => {
  try {
    logger.start('Starting the bot...');

    const { bot } = await import('./bot');
    const { handleCleanup } = await import('./cleanup');

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