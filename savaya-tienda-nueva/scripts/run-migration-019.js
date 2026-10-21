import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function main() {
  console.log('Running migration 019: add is_free_promo to shipping_methods...')

  await sql`
    ALTER TABLE shipping_methods
    ADD COLUMN IF NOT EXISTS is_free_promo BOOLEAN NOT NULL DEFAULT FALSE
  `

  console.log('Migration 019 complete. Run: node --env-file=.env.local scripts/run-migration-019.js')
}

main().catch((err) => {
  console.error('Migration 019 failed:', err)
  process.exit(1)
})
