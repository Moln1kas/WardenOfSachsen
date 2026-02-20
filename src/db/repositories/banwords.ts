import { eq } from "drizzle-orm";
import { db } from ".."
import { bannedWordsTable } from "../schema"

export const banwords = {
  getAll: async () => {
    const res = await db
      .select({ word: bannedWordsTable.word })
      .from(bannedWordsTable)
      .all();
    return res;
  },
  set: async (word: string, addedBy: number) => {
    await db
      .insert(bannedWordsTable)
      .values({
        word,
        addedBy,
        createdAt: Math.floor(Date.now() / 1000),
      })
      .run();
  },
  delete: async (word: string) => {
    await db
      .delete(bannedWordsTable)
      .where(eq(bannedWordsTable.word, word));
  }
}