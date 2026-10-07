// Migration 0016 — Convertir products.gender de pgEnum a text
//   Permite géneros dinámicos gestionados desde la tabla genders (navbar/categorías)
// Usage: node --env-file=.env.local scripts/run-migration-016.js

import { Pool } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const pool = new Pool({ connectionString: DB })

async function run() {
  console.log('Running migration 0016...')

  await pool.query(`
    ALTER TABLE products ALTER COLUMN gender TYPE text
  `)
  console.log('  [1/2] Columna products.gender convertida a text')

  // El enum puede tener dependencias (ej. constraints generadas por Drizzle).
  // Lo dejamos en la DB — es inofensivo y la columna ya es text.
  console.log('  [2/2] Enum gender conservado (puede tener dependencias — no afecta la operación)')

  console.log('Migration 0016 complete!')
  await pool.end()
}

run().catch(async (e) => {
  console.error('Migration failed:', e.message)
  await pool.end()
  process.exit(1)
})
