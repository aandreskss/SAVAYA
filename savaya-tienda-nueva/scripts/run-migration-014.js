// Migration 0014 — Cloudinary asset notifications log
//   Creates cloudinary_notifications table to track webhook events
// Usage: node --env-file=.env.local scripts/run-migration-014.js
import { Pool } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const pool = new Pool({ connectionString: DB })

async function run() {
  console.log('Running migration 0014...')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cloudinary_notifications (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      notification_type TEXT        NOT NULL,
      public_ids        TEXT[]      NOT NULL DEFAULT '{}',
      resource_type     TEXT        NOT NULL DEFAULT 'image',
      payload           JSONB       NOT NULL DEFAULT '{}',
      received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('  [1/2] Tabla cloudinary_notifications creada')

  await pool.query(`
    CREATE INDEX IF NOT EXISTS cloudinary_notifications_received_at_idx
      ON cloudinary_notifications (received_at DESC)
  `)
  console.log('  [2/2] Índice por received_at creado')

  console.log('Migration 0014 complete!')
  await pool.end()
}

run().catch(async (e) => {
  console.error('Migration failed:', e.message)
  await pool.end()
  process.exit(1)
})
