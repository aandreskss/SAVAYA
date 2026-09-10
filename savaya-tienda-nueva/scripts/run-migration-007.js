// Run migration 0007 against Supabase Postgres — creates page_views table
// Safe to run multiple times (IF NOT EXISTS).
// Usage: node --env-file=.env.local scripts/run-migration-007.js
import { neon } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with: node --env-file=.env.local scripts/run-migration-007.js')
  process.exit(1)
}

const sql = neon(DB)

async function run() {
  console.log('Running migration 0007 (page_views)...')

  await sql`
    CREATE TABLE IF NOT EXISTS page_views (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      path        TEXT        NOT NULL,
      referrer    TEXT,
      session_id  TEXT,
      country     TEXT,
      city        TEXT,
      device_type TEXT,
      browser     TEXT,
      os          TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log('  [1/5] tabla page_views creada (o ya existía)')

  await sql`CREATE INDEX IF NOT EXISTS page_views_path_idx       ON page_views (path)`
  console.log('  [2/5] índice path')
  await sql`CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at)`
  console.log('  [3/5] índice created_at')
  await sql`CREATE INDEX IF NOT EXISTS page_views_country_idx    ON page_views (country)`
  console.log('  [4/5] índice country')
  await sql`CREATE INDEX IF NOT EXISTS page_views_session_id_idx ON page_views (session_id)`
  console.log('  [5/5] índice session_id')

  // Quick sanity check
  const [{ count }] = await sql`SELECT COUNT(*) AS count FROM page_views`
  console.log(`\nMigration 0007 complete! Filas actuales en page_views: ${count}`)
}

run().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})
