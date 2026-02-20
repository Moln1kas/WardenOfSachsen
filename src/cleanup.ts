import { bot } from './bot';
import { env } from './config';
import { sessions } from './db/repositories/sessions';
import { logger } from './utils/logger';
import { setTimeout as delay } from 'node:timers/promises';

let isCleaning = false;

logger.info(`Sessions cleanup interval: ${env.sessionsCleanupMs} ms`);

export const handleCleanup = async () => {
  if (isCleaning) return; 
  isCleaning = true;

  try {
    const expired = await sessions.getExpired(env.sessionsCleanupMs);
    if (expired.length === 0) return;

    logger.info(`Cleaning up ${expired.length} expired sessions...`);

    let successCount = 0;
    let errorsCount = 0;
    const BATCH_SIZE = 20;

    for (let i = 0; i < expired.length; i += BATCH_SIZE) {
      const batch = expired.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (session) => {
        try {
          await bot.api.declineChatJoinRequest(env.channelId, session.userId);
          successCount++;
        } catch (err) {
          errorsCount++;
        }
      }));

      const idsToDelete = batch.map(s => s.userId);
      await sessions.deleteBatch(idsToDelete);

      if (expired.length > BATCH_SIZE) {
        await delay(1000); 
      }
    }
    logger.success(`Cleanup finished. Success: ${successCount}. Failed: ${errorsCount}.`);
  } catch (err) {
    logger.error('Cleanup error:', err);
  } finally {
    isCleaning = false;
  }
};