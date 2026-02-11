import { Database } from "bun:sqlite";
import { join } from "path";
import { env } from "../config";

const CLEANUP_INTERVAL = env.sessionsCleanupMs;

const dbPath = join(process.cwd(), "bot.db");
export const db = new Database(dbPath);

db.run("PRAGMA journal_mode = WAL;");

db.run(`
  CREATE TABLE IF NOT EXISTS captcha_sessions (
    user_id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS banned_words (
    id INTEGER PRIMARY KEY,
    word TEXT UNIQUE NOT NULL,
    added_by INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON captcha_sessions(created_at)`);

export const getExpiredSessions = (intervalMs: number) => {
  const ago = Date.now() - intervalMs;

  return db.query("SELECT user_id FROM captcha_sessions WHERE created_at < ?")
          .all(ago)
          .map((row: any) => row.user_id);
}

export const deleteSessions = (ids: number[]) => {
  if (ids.length === 0) return;

  const statement = db.prepare(`DELETE FROM captcha_sessions WHERE user_id = ?`);
  const transaction = db.transaction((userIds) => {
    for (const id of userIds) statement.run(id);
  });
  transaction(ids);
};
