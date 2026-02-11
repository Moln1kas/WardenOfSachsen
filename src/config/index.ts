import { logger } from "../utils/logger";

export const env = {
  token: Bun.env.TOKEN || '',
  adminId: Number(Bun.env.ADMIN_TELEGRAM_ID) || 0,
  channelId: Number(Bun.env.CHANNEL_TELEGRAM_ID) || 0,
  groupId: Number(Bun.env.GROUP_TELEGRAM_ID) || 0,
  sessionsCleanupMinutes: Number(Bun.env.SESSIONS_CLEANUP_MINUTES) || 30,
  get sessionsCleanupMs() {
    return this.sessionsCleanupMinutes * 60 * 1000;
  },
  bunkerThresholdCount: Number(Bun.env.BUNKER_THRESHOLD_COUNT) || 10,
  bunkerThresholdWidnowMs: Number(Bun.env.BUNKER_THRESHOLD_WINDOW_MS) || 10000,
  bunkerDurationMinutes: Number(Bun.env.BUNKER_DURATION_MINUTES) || 20,
  get bunkerDurationMs() {
    return this.bunkerDurationMinutes * 60 * 1000;
  },
};

if (!env.token) logger.error('Error: TOKEN is missing in .env');
if (!env.adminId) logger.error('Error: ADMIN_TELEGRAM_ID is missing in .env');
if (!env.channelId) logger.error('Error: CHANNEL_TELEGRAM_ID is missing in .env');
if (!env.groupId) logger.error('Error: GROUP_TELEGRAM_ID is missing in .env');
if (!env.sessionsCleanupMinutes) {
  logger.error('Error: SESSIONS_CLEANUP_MINUTES is missing in .env');
}
if (!env.bunkerThresholdCount) logger.error('Error: BUNKER_THRESHOLD_COUNT is missing in .env');
if (!env.bunkerThresholdWidnowMs) logger.error('Error: BUNKER_THRESHOLD_WINDOW_MS is missing in .env');
if (!env.bunkerDurationMinutes) logger.error('Error: BUNKER_DURATION_MINUTES is missing in .env');