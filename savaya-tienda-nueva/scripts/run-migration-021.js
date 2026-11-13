import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const migration = await readFile(new URL('./migrations/021_google_paid_purchases.sql', import.meta.url), 'utf8')
// All statements run atomically through the driver's transaction API.
await sql.transaction(migration.split(';').map((s) => s.trim()).filter(Boolean).map((s) => sql.query(s)))
console.log('Migration 021 complete: Google paid-purchase queue created. No historical orders queued.')
