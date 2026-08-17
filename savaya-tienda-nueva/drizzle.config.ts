import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/domains/**/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: (process.env.DIRECT_URL ?? process.env.DATABASE_URL)!,
  },
})
