import { Composer, InputFile } from "grammy";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const logsModule = new Composer();

const LOGS_DIR = './logs';

logsModule.command('logs', async (ctx) => {
  const date = new Date();
  const fileName = `${date.toISOString().split('T')[0]}.log`;
  const filePath = join(LOGS_DIR, fileName);

  if (existsSync(filePath)) {
    await ctx.replyWithDocument(new InputFile(filePath), {
      caption: `Лог за сегодня (${fileName})`
    });
  } else {
    await ctx.reply('Сегодняшний файл логов еще не создан.');
  }
});