import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { env } from '../config';

const sqlite = new Database(env.dbFileName, {
  create: true,
  strict: true,
  readwrite: true,
});
sqlite.run('PRAGMA journal_mode = WAL;')

export const db = drizzle({ client: sqlite });