import { Context, type NextFunction } from 'grammy';
import { logger } from '../utils/logger';
import { env } from '../config';

export const groupGuard = async (ctx: Context, next: NextFunction) => {
  const chatId = ctx.chat?.id;

  if (ctx.chat?.type !== 'private' && chatId !== env.groupId) {
    logger.warn(`Attempt to use bot in unknown chat: ${chatId} (@${ctx.chat?.title})`);
    return;
  }

  await next();
}

export const adminGuard = async (ctx: Context, next: NextFunction) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  if (ctx.chat?.type === 'private') {
    if (userId !== env.adminId) {
      logger.warn(`Unauthorized private access attempt: @${ctx.from?.username} (${userId})`);
      return;
    }
  }

  if (chatId === env.groupId && userId !== env.adminId) {
    if (!ctx.message?.text?.startsWith('/')) {
      return await next();
    }

    return;
  }

  await next();
};