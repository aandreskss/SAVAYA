// Migration 0017 — Normalizar valores de gender en products
//   Convierte los valores legacy en inglés a los slugs en español usados por la tabla genders:
//     'women' → 'mujer'
//     'men'   → 'hombre'
//     'unisex' se mantiene igual
// Usage: node --env-file=.env.local scripts/run-migration-017.js

import { Pool } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const pool = new Pool({ connectionString: DB })

async function run() {
  console.log('Running migration 0017 — normalizing gender values...')

  const { rows: before } = await pool.query(`
    SELECT gender, COUNT(*) as total
    FROM products
    GROUP BY gender
    ORDER BY gender
  `)
  console.log('  Estado actual:', before.map(r => `${r.gender}: ${r.total}`).join(', '))

  const { rowCount: updated1 } = await pool.query(`
    UPDATE products SET gender = 'mujer' WHERE gender = 'women'
  `)
  console.log(`  [1/2] 'women' → 'mujer': ${updated1} productos actualizados`)

  const { rowCount: updated2 } = await pool.query(`
    UPDATE products SET gender = 'hombre' WHERE gender = 'men'
  `)
  console.log(`  [2/2] 'men' → 'hombre': ${updated2} productos actualizados`)

  const { rows: after } = await pool.query(`
    SELECT gender, COUNT(*) as total
    FROM products
    GROUP BY gender
    ORDER BY gender
  `)
  console.log('  Estado final:', after.map(r => `${r.gender}: ${r.total}`).join(', '))

  console.log('Migration 0017 complete!')
  await pool.end()
}

run().catch(async (e) => {
  console.error('Migration failed:', e.message)
  await pool.end()
  process.exit(1)
})
