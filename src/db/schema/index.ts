import { sql } from 'drizzle-orm';
import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const captchaSessionsTable = sqliteTable('captcha_sessions', {
  userId: int('user_id').primaryKey(),
  code: text('code').notNull(),
  attempts: int('attempts').default(0).notNull(),
  createdAt: int('created_at').default(sql`(unixepoch())`).notNull(),
}, (t) => ([
  index('idx_created_at').on(t.createdAt),
]));

export const bannedWordsTable = sqliteTable('banned_words', {
  id: int('id').primaryKey({ autoIncrement: true }),
  word: text('word').unique().notNull(),
  addedBy: int('added_by').notNull(),
  createdAt: int('created_at').default(sql`(unixepoch())`).notNull(),
});