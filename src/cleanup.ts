import { bot } from './bot';
import { env } from './config';
import { deleteSessions, getExpiredSessions } from './db';
import { logger } from './utils/logger';
import { setTimeout as delay } from 'node:timers/promises';

let isCleaning = false;

export const handleCleanup = async () => {
  if (isCleaning) return; 
  isCleaning = true;

  try {
    const expired = getExpiredSessions(env.sessionsCleanupMs);
    if (expired.length === 0) return;

    logger.info(`Cleaning up ${expired.length} expired sessions...`);

    let successCount = 0;
    let errorsCount = 0;

    const BATCH_SIZE = 20;

    for (let i = 0; i < expired.length; i += BATCH_SIZE) {
      const batch = expired.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (session) => {
        try {
          await bot.api.declineChatJoinRequest(env.channelId, session.user_id);
          successCount++;
        } catch (err) {
          errorsCount++;
        }
      }));

      deleteSessions(batch);

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