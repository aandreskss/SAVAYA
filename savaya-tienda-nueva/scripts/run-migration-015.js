// Migration 0015 — Géneros dinámicos para navbar y categorías
//   Crea la tabla `genders` y siembra los valores iniciales (mujer, hombre)
// Usage: node --env-file=.env.local scripts/run-migration-015.js

import { Pool } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const pool = new Pool({ connectionString: DB })

async function run() {
  console.log('Running migration 0015...')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS genders (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      slug        TEXT        NOT NULL UNIQUE,
      label       TEXT        NOT NULL,
      sort_order  INTEGER     NOT NULL DEFAULT 0,
      is_active   BOOLEAN     NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('  [1/3] Tabla genders creada')

  await pool.query(`
    CREATE INDEX IF NOT EXISTS genders_slug_idx       ON genders (slug);
    CREATE INDEX IF NOT EXISTS genders_sort_order_idx ON genders (sort_order);
  `)
  console.log('  [2/3] Índices creados')

  await pool.query(`
    INSERT INTO genders (slug, label, sort_order)
    VALUES
      ('mujer',  'Mujer',  0),
      ('hombre', 'Hombre', 1)
    ON CONFLICT (slug) DO NOTHING
  `)
  console.log('  [3/3] Datos semilla insertados (mujer, hombre)')

  console.log('Migration 0015 complete!')
  await pool.end()
}

run().catch(async (e) => {
  console.error('Migration failed:', e.message)
  await pool.end()
  process.exit(1)
})
