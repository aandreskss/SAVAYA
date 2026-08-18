/**
 * Script de migración: Supabase → Neon
 *
 * Uso:
 *   node scripts/migrate-supabase-to-neon.mjs
 *
 * Variables de entorno necesarias:
 *   SOURCE_DB  = connection string de Supabase (puerto 5432 directo, NO pooler)
 *   TARGET_DB  = connection string de Neon
 */

import postgres from 'postgres'

const SOURCE = process.env.SOURCE_DB
const TARGET = process.env.TARGET_DB

if (!SOURCE || !TARGET) {
  console.error('Faltan variables SOURCE_DB y/o TARGET_DB')
  process.exit(1)
}

const src = postgres(SOURCE, { max: 1, prepare: false })
const dst = postgres(TARGET, { max: 1, ssl: 'require' })

// Tablas en orden correcto para respetar foreign keys
const TABLES = [
  // Auth / core
  'users',
  'accounts',
  'sessions',
  'verification_tokens',
  // Roles & permisos
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  // Catálogo
  'categories',
  'collections',
  'colors',
  'sizes',
  'products',
  'product_variants',
  'product_media',
  'product_collections',
  // Inventario
  'inventory',
  'inventory_movements',
  // Clientes
  'customers',
  'addresses',
  'customer_tags',
  'customer_notes',
  // Métodos de pago
  'payment_methods',
  // Descuentos
  'discounts',
  'coupon_usages',
  // Envío
  'shipping_zones',
  'shipping_cities',
  'shipping_methods',
  'shipping_rates',
  // Carrito
  'carts',
  'cart_items',
  // Pedidos
  'orders',
  'order_items',
  'order_status_history',
  // Comprobantes
  'payment_proofs',
  // CMS
  'cms_sections',
  'banners',
  'popups',
  // Exchange rates
  'exchange_rates',
  // Analytics
  'order_attributions',
  // Settings
  'application_settings',
  // Audit log
  'audit_log',
  // Notifications
  'notification_log',
  // Wholesale
  'wholesale_leads',
  // 2FA
  'two_factor_secrets',
  'two_factor_backup_codes',
]

async function migrateTable(table) {
  const rows = await src.unsafe(`SELECT * FROM ${table}`)
  if (rows.length === 0) {
    console.log(`  ⏭  ${table} — vacía, se omite`)
    return
  }

  // Disable triggers/constraints temporarily and insert in batches
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const cols = Object.keys(batch[0])
    const colList = cols.map(c => `"${c}"`).join(', ')

    for (const row of batch) {
      const vals = cols.map(c => row[c])
      const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(', ')
      await dst.unsafe(
        `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        vals
      )
      inserted++
    }
  }

  console.log(`  ✓  ${table} — ${inserted} filas migradas`)
}

async function main() {
  console.log('\n🚀 Iniciando migración Supabase → Neon\n')

  // Disable FK checks during migration
  await dst`SET session_replication_role = 'replica'`

  for (const table of TABLES) {
    try {
      await migrateTable(table)
    } catch (err) {
      console.error(`  ✗  ${table} — ERROR: ${err.message}`)
    }
  }

  // Re-enable FK checks
  await dst`SET session_replication_role = 'origin'`

  console.log('\n✅ Migración completa\n')

  await src.end()
  await dst.end()
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
