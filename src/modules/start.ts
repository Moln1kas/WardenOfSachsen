import { env } from '../config';
import { Composer } from "grammy";

export const startModule = new Composer();

startModule.command("start", async (ctx) => {
  if (ctx.from?.id === env.adminId) {
    return await ctx.reply('Привет, создатель.');
  }

  await ctx.reply('Вы не мой создатель.');
});
