import { Context, type NextFunction } from 'grammy';
import { env } from '../config';

export const groupGuard = async (ctx: Context, next: NextFunction) => {
  if (ctx.chat?.type === 'private') return next();

  if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
    if (ctx.chat.id !== env.groupId) {
      return;
    }
  }

  await next();
};

export const adminGuard = async (ctx: Context, next: NextFunction) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  if (ctx.chat?.type === 'private') {
    if (userId !== env.adminId) {
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