import { Composer, InlineKeyboard, InputFile } from 'grammy';
import { generateCaptchaVoice } from '../utils/captcha';
import { unlink } from 'node:fs/promises';
import { env } from '../config';
import { logger } from '../utils/logger';
import { sessions } from '../db/repositories/sessions';

export const joinModule = new Composer();
const MAX_ATTEMPTS = 3;
const CLEANUP_INTERVAL = env.sessionsCleanupMinutes;

const requestTimestamps: number[] = [];
const BUNKER_THRESHOLD_COUNT = env.bunkerThresholdCount;
const BUNKER_THRESHOLD_WINDOW_MS = env.bunkerThresholdWidnowMs;
const BUNKER_DURATION_MINUTES = env.bunkerDurationMinutes;
const BUNKER_DURATION_MS = env.bunkerDurationMs;

let isBunkerMode = false;
let bunkerDeclineCount = 0;

const checkFlood = (): boolean => {
  const now = Date.now();

  while (requestTimestamps.length > 0 && (requestTimestamps[0] ?? 0) < now - BUNKER_THRESHOLD_WINDOW_MS) {
    requestTimestamps.shift();
  }
  
  requestTimestamps.push(now);
  
  return requestTimestamps.length > BUNKER_THRESHOLD_COUNT;
};

joinModule.on('chat_join_request', async (ctx) => {
  const userId = ctx.chatJoinRequest.user_chat_id;
  const chatId = ctx.chat.id;
  
  logger.debug(`Join request from user ${userId} to chat ${chatId}`);

  if (chatId !== env.channelId) return;

  const declineRequest = async () => {
    try {
      await ctx.api.declineChatJoinRequest(env.channelId, userId);
    } catch (err) {
      await sessions.set(userId, `REJECT_${crypto.randomUUID()}`);
    }
  }

  if(isBunkerMode) {
    await declineRequest();
    bunkerDeclineCount++
    return;
  }

  if(!isBunkerMode && checkFlood()) {
    isBunkerMode = true;

    await ctx.api.sendMessage(env.adminId,
      '<b>Зафиксирована атака!!!</b>\n\n'+
      `Режим бункера активирован. Срок: ${BUNKER_DURATION_MINUTES}мин.`,
      { parse_mode: 'HTML' },
    ).catch(() => { });
    logger.warn('ATTACK! Bunker is enabled.');

    await declineRequest();

    setTimeout(async () => {
      isBunkerMode = false;

      await ctx.api.sendMessage(env.adminId, `Режим бункера автоматически отключен. Отклонено ${bunkerDeclineCount} заявок.`)
        .catch(() => { });
      logger.warn(`Bunker is automatically disabled. Declined: ${bunkerDeclineCount}`);

      bunkerDeclineCount = 0;
    }, BUNKER_DURATION_MS);

    return;
  }

  const digits = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
  const codeStr = digits.join('');

  const isPremium = ctx.from?.is_premium;

  if(isPremium) {
    const inlineKeyboard = new InlineKeyboard().text('Я человек', 'im-human-payload');
    await ctx.api.sendMessage(userId,
      '<b>Для входа в канал, нажмите на кнопку.</b>',
      {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      }
    );
    return;
  }

  let voicePath: string | undefined;
  try {
    voicePath = await generateCaptchaVoice(digits);
    await ctx.api.sendVoice(userId, new InputFile(voicePath), {
      caption: 
        '<b>Для входа в канал, введите код из аудио.</b>\n\n' +
        `<blockquote>Попыток: ${MAX_ATTEMPTS}.\n` +
        `Времени: ${CLEANUP_INTERVAL}мин.</blockquote>\n\n` +
        '<i>Знаки препинания вводить не требуется.</i>',
      parse_mode: 'HTML',
    });
    
    await sessions.set(userId, codeStr);
  } catch (err) {
    logger.error('Join error:', err);
  } finally {
    if (voicePath) {
      await unlink(voicePath).catch((err) => 
        logger.error('Failed to delete temp file:', err)
      );
    }
  }
});

joinModule.callbackQuery('im-human-payload', async (ctx) => {
  const userId = ctx.from?.id;
  if(!userId) return;

  if (!ctx.from.is_premium) {
    return await ctx.answerCallbackQuery({
      text: 'Только обладатели Telegram Premium могут войти по кнопке. Пройдите классическую капчу с цифрами.',
      show_alert: true
    });
  }

  try {
    await ctx.api.approveChatJoinRequest(env.channelId, userId);
    await ctx.reply('Ваша заявка принята.');
  } catch {
    await ctx.answerCallbackQuery({
      text: 'Что-то пошло не так.'
    });
  }
});
//   const userId = ctx.from?.id;
//   if(!userId) return;

//   const declineRequest = async () => {
//     await ctx.api.declineChatJoinRequest(env.channelId, userId)
//           .catch(() => {
//             sessions.set(userId, `REJECT_${crypto.randomUUID()}`);
//           });
//   }

//   if(isBunkerMode) {
//     await declineRequest();
//     bunkerDeclineCount++
//     return;
//   }

//   if(!isBunkerMode && checkFlood()) {
//     isBunkerMode = true;

//     await ctx.api.sendMessage(env.adminId,
//       '<b>Зафиксирована атака!!!</b>\n\n'+
//       `Режим бункера активирован. Срок: ${BUNKER_DURATION_MINUTES}мин.`,
//       { parse_mode: 'HTML' },
//     );
//     logger.warn('ATTACK! Bunker is enabled.');

//     await declineRequest();

//     setTimeout(() => {
//       isBunkerMode = false;

//       ctx.api.sendMessage(env.adminId, `Режим бункера автоматически отключен. Отклонено ${bunkerDeclineCount} заявок.`);
//       logger.warn(`Bunker is automatically disabled. Declined: ${bunkerDeclineCount}`);

//       bunkerDeclineCount = 0;
//     }, BUNKER_DURATION_MS);

//     return;
//   }

//   const digits = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
//   const codeStr = digits.join('');
//   const isPremium = ctx.from?.is_premium;

//   if(isPremium) {
//     const inlineKeyboard = new InlineKeyboard().text('Я человек', 'im-human-payload');
//     await ctx.reply(
//       '<b>Для входа в канал, нажмите на кнопку.</b>',
//       {
//         parse_mode: 'HTML',
//         reply_markup: inlineKeyboard,
//       }
//     );
//     return;
//   }

//   let voicePath: string | undefined;
//   try {
//     voicePath = await generateCaptchaVoice(digits);

//     await ctx.replyWithVoice(new InputFile(voicePath), {
//       caption: 
//         '<b>Для входа в канал, введите код из аудио.</b>\n\n' +
//         `<blockquote>Попыток: ${MAX_ATTEMPTS}\n` +
//         `Времени: ${CLEANUP_INTERVAL}мин</blockquote>\n\n` +
//         '<i>Знаки препинания не нужны.</i>',
//       parse_mode: 'HTML',
//     });
    
//     sessions.set(userId, codeStr);
//   } catch (err) {
//     logger.error('Join error:', err);
//   } finally {
//     if (voicePath) {
//       await unlink(voicePath).catch((err) => 
//         logger.error('Failed to delete temp file:', err)
//       );
//     }
//   }
// });

joinModule.on('message:text', async (ctx, next) => {
  const userId = ctx.from.id;
  const session = await sessions.get(userId);

  if (
    !session || 
    ctx.message.text.startsWith('/') ||
    session.code.startsWith('REJECT')
  ) return await next();

  if (ctx.message.text.trim() === session.code) {
    await sessions.delete(userId);
    try {
      await ctx.api.approveChatJoinRequest(env.channelId, userId);

      await ctx.reply(`Ваша заявка одобрена.`);
    } catch (e) {
      await ctx.reply(`Не удалось одобрить вашу заявку.`);
    }
  } else {
    await sessions.incrementAttempt(userId);
    const updatedSession = await sessions.get(userId);

    const currentAttempts = updatedSession?.attempts ?? 0;

    if (currentAttempts >= MAX_ATTEMPTS) {
      await sessions.delete(userId);
      await ctx.reply('Капча провалена. Вы можете подать заявку на вступление заново.');
    } else {
      await ctx.reply(`Неверно. Попыток: ${MAX_ATTEMPTS - currentAttempts}`);
    }
  }
});