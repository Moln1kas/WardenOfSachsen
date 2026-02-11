import { Bot, Context } from 'grammy';
import { env } from './config';
import { rootRouter } from './routers';

export const bot = new Bot<Context>(env.token);

bot.use(rootRouter);