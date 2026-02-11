import { Composer } from 'grammy';
import { db } from '../db';
import { logger } from '../utils/logger';
import { env } from '../config';

export const adminModule = new Composer();

const bannedWordsCache = new Set<string>();
const words = db.query('SELECT word FROM banned_words').all() as { word: string }[];
words.forEach(row => bannedWordsCache.add(row.word.toLowerCase()));

const normalizeText = (text: string): string => {
  const charMap: Record<string, string> = {
    'a': 'а', 'b': 'в', 'e': 'е', 'k': 'к', 'm': 'м', 'h': 'н', 
    'o': 'о', 'p': 'р', 'c': 'с', 't': 'т', 'y': 'у', 'x': 'х',
    '3': 'е', '0': 'о', 'ё' : 'е', '@' : 'а', 'n' : 'н', 'º': 'о',
    'zh' : 'ж', '×': 'x', '8': 'в', '4': 'а', '6': 'б', 'u': 'у', 'i': 'и'
  };

  let result = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  result = [...result]
    .map(char => charMap[char] || char)
    .join('');

  return result
    .replace(/[^а-яёa-z0-9\p{Extended_Pictographic}\p{Emoji_Component}]/gu, '') 
    .replace(/(.)\1+/g, '$1'); 
};

const reverseString = (str: string) => str.split('').reverse().join('');

adminModule.on('message:text', async (ctx, next) => {
  if(ctx.from.id === env.adminId) return await next();

  const text = ctx.message.text;
  const normalized = normalizeText(text);
  const reversed = reverseString(normalized);

  const hasBannedWord = Array.from(bannedWordsCache).some(badWord => {
    const normBadWord = normalizeText(badWord); 
    if (!normBadWord) return false;
    
    if (normalized.includes(normBadWord) || reversed.includes(normBadWord)) {
      if (normBadWord.length < 4) {
        if (/\p{Emoji}/u.test(normBadWord)) return true;

        const pattern = [...normBadWord].map(c => `${c}+`).join('[^а-яёa-z0-9]*');
        const regex = new RegExp(`(?<![а-яёa-z0-9])${pattern}(?![а-яёa-z0-9])`, 'ui');
        return regex.test(text) || regex.test(reverseString(text));
      }
      return true;
    }
    return false;
  });

  if (hasBannedWord) {
    try {
      await ctx.deleteMessage();
      
      const warning = await ctx.reply(`@${ctx.from.username}, не шали.`);
      
      setTimeout(() => {
        ctx.api.deleteMessage(ctx.chat.id, warning.message_id).catch(() => {});
      }, 5000);

      return;
    } catch (err) {
      logger.error('Failed to filter message:', err);
    }
  }

  await next();
});

adminModule.command('banword', async (ctx) => {
  const userId = ctx.from?.id;
  if(!userId) return;

  const word = ctx.match?.trim().toLowerCase();
  if (!word) return ctx.reply('Пример: /banword плохоеслово');

  try {
    db.run('INSERT INTO banned_words (word, added_by, created_at) VALUES (?, ?, ?)', 
      [word, userId, Date.now()]);
    
    bannedWordsCache.add(word);
    await ctx.reply(`Слово '<b>${word}</b>' добавлено в фильтр.`, { parse_mode: 'HTML' });
  } catch (e) {
    await ctx.reply('Это слово уже есть в списке.');
  }
});

adminModule.command('unbanword', async (ctx) => {
  const word = ctx.match?.trim().toLowerCase();
  if (!word) return ctx.reply('Пример: /unbanword неплохоеслово');

  db.run('DELETE FROM banned_words WHERE word = ?', [word]);
  const deleted = bannedWordsCache.delete(word);

  if (deleted) {
    await ctx.reply(`Слово '<b>${word}</b>' удалено из фильтра.`, { parse_mode: 'HTML' });
  } else {
    await ctx.reply('Такого слова нет в списке.');
  }
});

adminModule.command('wordlist', async (ctx) => {
    if (bannedWordsCache.size === 0) return ctx.reply('Список пуст.');
    const list = Array.from(bannedWordsCache).join(', ');
    await ctx.reply(`<b>Запрещенные слова:</b>\n\n${list}`, { parse_mode: 'HTML' });
});

adminModule.command('ban', async (ctx) => {
  if(!ctx.message?.reply_to_message) return;

  const reply = ctx.message.reply_to_message;
  if(!reply.from) return;

  const userId = reply.from.id;
  const username = reply.from.first_name;

  try {
    await ctx.banChatMember(userId);
    await ctx.reply(`<b>${username}</b> успешно забанен.`, { parse_mode: 'HTML' });
  } catch (err) {
    logger.error('Ban error:', err);
    await ctx.reply('Не удалось забанить пользователя.');
  }
});

adminModule.command('unban', async (ctx) => {
  const userId = Number(ctx.match);
  if(isNaN(userId)) return ctx.reply('Пример: /unban id');

  try {
    await ctx.unbanChatMember(userId, { only_if_banned: true });
    await ctx.reply(`Пользователь успешно разбанен.`, { parse_mode: 'HTML' });
  } catch (err) {
    logger.error('Unban error:', err);
    await ctx.reply('Не удалось разбанить пользователя.');
  }
});