import { db } from '..';
import { captchaSessionsTable } from '../schema';
import { eq, sql, lt, inArray } from 'drizzle-orm';

export const sessions = {
  get: async (id: number) => {
    const res = await db
      .select()
      .from(captchaSessionsTable)
      .where(eq(captchaSessionsTable.userId, id))
      .get();
    return res;
  },
  set: async (id: number, code: string) => {
    await db
      .insert(captchaSessionsTable)
      .values({
        userId: id,
        code,
        attempts: 0,
        createdAt: Math.floor(Date.now() / 1000),
      })
      .onConflictDoUpdate({
        target: captchaSessionsTable.userId,
        set: {
          code,
          attempts: 0,
          createdAt: Math.floor(Date.now() / 1000),
        }
      });
  },
  incrementAttempt: async (id: number) => {
    await db
      .update(captchaSessionsTable)
      .set({
        attempts: sql`${captchaSessionsTable.attempts} + 1`
      })
      .where(eq(captchaSessionsTable.userId, id));
  },
  delete: async (id: number) => {
    await db
      .delete(captchaSessionsTable)
      .where(eq(captchaSessionsTable.userId, id));
  },
  getExpired: async (intervalMs: number) => {
    const threshold = Math.floor((Date.now() - intervalMs) / 1000);
    return await db
      .select()
      .from(captchaSessionsTable)
      .where(lt(captchaSessionsTable.createdAt, threshold))
      .all();
  },
  deleteBatch: async (ids: number[]) => {
    if (ids.length === 0) return;
    await db
      .delete(captchaSessionsTable)
      .where(inArray(captchaSessionsTable.userId, ids));
  }
};