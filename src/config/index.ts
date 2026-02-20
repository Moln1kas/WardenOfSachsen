import { logger } from "../utils/logger";
import * as z from 'zod';

const EnvSchema = z.object({
  TOKEN: z.string(),

  DB_FILE_NAME: z.string().default('bot.db'),

  ADMIN_TELEGRAM_ID: z.coerce.number(),
  CHANNEL_TELEGRAM_ID: z.coerce.number(),
  GROUP_TELEGRAM_ID: z.coerce.number(),

  SESSIONS_CLEANUP_MINUTES: z.coerce.number().default(30),

  BUNKER_THRESHOLD_COUNT: z.coerce.number().default(10),
  BUNKER_THRESHOLD_WINDOW_MS: z.coerce.number().default(10000),
  BUNKER_DURATION_MINUTES: z.coerce.number().default(20),
});

const res = EnvSchema.safeParse(process.env);

if(!res.success) {
  res.error.issues.forEach((issue) => {
    logger.error(`Env Config Error: ${issue.path.join(".")} - ${issue.message}`);
  });
  process.exit(1);
}

const parsedEnv = res.data;

export const env = {
  token: parsedEnv.TOKEN,

  dbFileName: parsedEnv.DB_FILE_NAME,

  adminId: parsedEnv.ADMIN_TELEGRAM_ID,
  channelId: parsedEnv.CHANNEL_TELEGRAM_ID,
  groupId: parsedEnv.GROUP_TELEGRAM_ID,
  
  bunkerThresholdCount: parsedEnv.BUNKER_THRESHOLD_COUNT,
  bunkerThresholdWidnowMs: parsedEnv.BUNKER_THRESHOLD_WINDOW_MS,
  bunkerDurationMinutes: parsedEnv.BUNKER_DURATION_MINUTES,

  sessionsCleanupMinutes: parsedEnv.SESSIONS_CLEANUP_MINUTES,

  get sessionsCleanupMs() {
    return parsedEnv.SESSIONS_CLEANUP_MINUTES * 60 * 1000;
  },
  get bunkerDurationMs() {
    return parsedEnv.BUNKER_DURATION_MINUTES * 60 * 1000;
  },
};