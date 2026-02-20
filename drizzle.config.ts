import { defineConfig } from 'drizzle-kit';
import { env } from './src/config';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: env.dbFileName,
  },
});
