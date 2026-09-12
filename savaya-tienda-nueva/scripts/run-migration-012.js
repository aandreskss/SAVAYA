// Migration 0012 — creates savaya_order_seq PostgreSQL sequence for race-free order numbers.
// The sequence is initialized to MAX(numeric part of existing order numbers) + 1,
// so existing order numbers are never repeated.
// Usage: node --env-file=.env.local scripts/run-migration-012.js
import { Pool } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const pool = new Pool({ connectionString: DB })

async function run() {
  console.log('Running migration 0012...')

  // Determine starting value from existing order numbers (SAV-XXXXXX format)
  const { rows: [{ max_num }] } = await pool.query(`
    SELECT COALESCE(
      MAX(CAST(REGEXP_REPLACE(order_number, '[^0-9]', '', 'g') AS BIGINT)),
      0
    ) AS max_num
    FROM orders
    WHERE order_number ~ '^SAV-[0-9]+'
  `)

  const startWith = BigInt(max_num) + 1n
  console.log(`  Max order number found: ${max_num} — sequence will start at ${startWith}`)

  // DDL with inline value: pool.query(string) sends raw SQL, no parameterization
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'savaya_order_seq') THEN
        CREATE SEQUENCE savaya_order_seq START WITH ${startWith} INCREMENT BY 1 NO CYCLE;
      END IF;
    END
    $$
  `)
  console.log(`  [1/1] sequence savaya_order_seq creada (START ${startWith})`)

  console.log('Migration 0012 complete!')
  await pool.end()
}

run().catch(async (e) => {
  console.error('Migration failed:', e.message)
  await pool.end()
  process.exit(1)
})
