// Run migration 0011 against Neon — creates newsletter_subscribers table
// Usage: node scripts/run-migration-011.js
import { neon } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const sql = neon(DB)

async function run() {
  console.log('Running migration 0011...')

  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email       TEXT        NOT NULL UNIQUE,
      status      TEXT        NOT NULL DEFAULT 'active',
      source      TEXT        NOT NULL DEFAULT 'website',
      resend_contact_id TEXT,
      subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      unsubscribed_at TIMESTAMPTZ
    )
  `
  console.log('  [1/2] tabla newsletter_subscribers creada')

  await sql`CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON newsletter_subscribers(email)`
  await sql`CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers(status)`
  console.log('  [2/2] índices creados')

  console.log('Migration 0011 complete!')
}

run().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})
