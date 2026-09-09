// Run migration 0009 against Neon
// Usage: node scripts/run-migration-009.js
import { neon } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const sql = neon(DB)

async function run() {
  console.log('Running migration 0009...')

  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'unisex'`
  console.log('  [1/4] gender column added to categories')

  await sql`
    CREATE TABLE IF NOT EXISTS nav_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      label TEXT NOT NULL,
      href TEXT,
      type TEXT NOT NULL DEFAULT 'link',
      gender TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log('  [2/4] nav_items table created')

  await sql`CREATE INDEX IF NOT EXISTS nav_items_is_active_idx ON nav_items (is_active)`
  await sql`CREATE INDEX IF NOT EXISTS nav_items_sort_order_idx ON nav_items (sort_order)`
  console.log('  [3/4] indexes created')

  await sql`
    INSERT INTO nav_items (label, href, type, gender, sort_order, is_active) VALUES
      ('Mujer',   '/mujer',   'category_group', 'mujer',  1, true),
      ('Hombre',  '/hombre',  'category_group', 'hombre', 2, true),
      ('Nuevos',  '/nuevos',  'link',           NULL,     3, true),
      ('Ofertas', '/ofertas', 'link',           NULL,     4, true)
  `
  console.log('  [4/4] seed data inserted')
  console.log('Migration 0009 complete!')
}

run().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})
