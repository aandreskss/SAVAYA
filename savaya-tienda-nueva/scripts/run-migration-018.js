// Migration 0018 — Agregar tallas infantiles (8-34)
//   Las tallas 35-40 ya existen para adultos.
//   Las tallas 8-34 son exclusivas para géneros infantiles (niños, niñas).
//   Ambos rangos comparten 35-37.
// Usage: node --env-file=.env.local scripts/run-migration-018.js

import { Pool } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const pool = new Pool({ connectionString: DB })

async function run() {
  console.log('Running migration 0018 — tallas infantiles...')

  // Tallas infantiles: 8 al 34 (35-40 ya existen como tallas adultas)
  const kidsSizes = []
  for (let i = 8; i <= 34; i++) {
    kidsSizes.push(i)
  }

  let inserted = 0
  let skipped = 0

  for (const size of kidsSizes) {
    try {
      await pool.query(
        `INSERT INTO sizes (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [String(size), size]
      )
      inserted++
    } catch {
      skipped++
    }
  }

  // Verificar estado final
  const { rows } = await pool.query(`
    SELECT name, sort_order FROM sizes ORDER BY sort_order::int, sort_order
  `)
  console.log(`  Tallas en DB (${rows.length} total):`, rows.map(r => r.name).join(', '))
  console.log(`  Insertadas: ${inserted}, Omitidas (ya existían): ${skipped}`)
  console.log('Migration 0018 complete!')
  await pool.end()
}

run().catch(async (e) => {
  console.error('Migration failed:', e.message)
  await pool.end()
  process.exit(1)
})
