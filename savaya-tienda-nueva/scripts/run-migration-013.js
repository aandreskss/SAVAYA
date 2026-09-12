// Migration 0013 — Odoo integration setup:
//   1. Creates odoo_sync_logs table (with enums)
//   2. Inserts integrations:manage permission
//   3. Grants it to the super_admin role
// Usage: node --env-file=.env.local scripts/run-migration-013.js
import { Pool } from '@neondatabase/serverless'

const DB = process.env.DATABASE_URL
if (!DB) {
  console.error('DATABASE_URL not set — run with dotenv or set the var directly')
  process.exit(1)
}

const pool = new Pool({ connectionString: DB })

async function run() {
  console.log('Running migration 0013...')

  // 1. Enum types for odoo_sync_logs
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'odoo_sync_type') THEN
        CREATE TYPE odoo_sync_type AS ENUM ('full_sync', 'webhook');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'odoo_sync_status') THEN
        CREATE TYPE odoo_sync_status AS ENUM ('success', 'partial', 'error');
      END IF;
    END
    $$
  `)
  console.log('  [1/3] Enum types creados (odoo_sync_type, odoo_sync_status)')

  // 2. odoo_sync_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS odoo_sync_logs (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type            odoo_sync_type  NOT NULL,
      status          odoo_sync_status NOT NULL,
      items_synced    INTEGER NOT NULL DEFAULT 0,
      items_skipped   INTEGER NOT NULL DEFAULT 0,
      items_failed    INTEGER NOT NULL DEFAULT 0,
      error_message   TEXT,
      duration_ms     INTEGER,
      started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at    TIMESTAMPTZ
    )
  `)
  console.log('  [2/3] Tabla odoo_sync_logs creada')

  // 3. Insert integrations:manage permission + grant to super_admin
  await pool.query(`
    WITH new_perm AS (
      INSERT INTO permissions (id, resource, action, description)
      VALUES (gen_random_uuid(), 'integrations', 'manage', 'Gestionar integraciones externas (Odoo, etc.)')
      ON CONFLICT (resource, action) DO NOTHING
      RETURNING id
    ),
    perm AS (
      SELECT id FROM new_perm
      UNION ALL
      SELECT id FROM permissions WHERE resource = 'integrations' AND action = 'manage'
      LIMIT 1
    ),
    super_admin_role AS (
      SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1
    )
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT super_admin_role.id, perm.id
    FROM super_admin_role, perm
    ON CONFLICT DO NOTHING
  `)
  console.log('  [3/3] Permiso integrations:manage creado y asignado a super_admin')

  console.log('Migration 0013 complete!')
  await pool.end()
}

run().catch(async (e) => {
  console.error('Migration failed:', e.message)
  await pool.end()
  process.exit(1)
})
