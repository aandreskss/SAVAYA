// Run migration 0010 against Neon — adds product_grid and html_block to page_section_type enum
// Usage: node scripts/run-migration-010.js
import { neon } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const sql = neon(DB)

async function run() {
  console.log('Running migration 0010...')

  await sql`ALTER TYPE page_section_type ADD VALUE IF NOT EXISTS 'product_grid'`
  console.log('  [1/2] product_grid added to page_section_type enum')

  await sql`ALTER TYPE page_section_type ADD VALUE IF NOT EXISTS 'html_block'`
  console.log('  [2/2] html_block added to page_section_type enum')

  console.log('Migration 0010 complete!')
}

run().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})
