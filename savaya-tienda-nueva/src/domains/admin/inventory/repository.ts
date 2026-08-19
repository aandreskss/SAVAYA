import { db, rawQuery } from '@/shared/lib/db'
import { sql, inArray } from 'drizzle-orm'
import { productVariants } from '@/domains/catalog/schema'
import { inventory, inventoryMovements } from '@/domains/inventory/schema'
import { auditLog } from '@/domains/audit-log/schema'
import type { InventoryRow, MovementHistoryRow, ManualMovementPayload } from './types'
import { LOW_STOCK_THRESHOLD } from './types'

type ActorContext = {
  actorId: string
  actorEmail: string
  ip: string
}

export async function listInventory(search?: string): Promise<InventoryRow[]> {
  const searchFilter = search
    ? sql`AND (
        p.name ILIKE ${'%' + search + '%'}
        OR pv.sku ILIKE ${'%' + search + '%'}
        OR c.name ILIKE ${'%' + search + '%'}
        OR s.name ILIKE ${'%' + search + '%'}
      )`
    : sql``

  const rows = await rawQuery<{
    variant_id: string
    product_id: string
    product_name: string
    product_slug: string
    sku: string
    color_name: string
    color_hex: string | null
    size_name: string
    quantity: number
    reserved: number
  }>(sql`
    SELECT
      pv.id            AS variant_id,
      p.id             AS product_id,
      p.name           AS product_name,
      p.slug           AS product_slug,
      pv.sku           AS sku,
      c.name           AS color_name,
      c.hex            AS color_hex,
      s.name           AS size_name,
      COALESCE(i.quantity, 0) AS quantity,
      COALESCE(i.reserved, 0) AS reserved
    FROM product_variants pv
    JOIN products          p  ON p.id  = pv.product_id
    JOIN colors            c  ON c.id  = pv.color_id
    JOIN sizes             s  ON s.id  = pv.size_id
    LEFT JOIN inventory    i  ON i.variant_id = pv.id
    WHERE pv.is_active = true
      AND p.is_active  = true
    ${searchFilter}
    ORDER BY p.name ASC, s.sort_order ASC, c.name ASC
  `)

  return rows.map((r) => ({
    variantId: r.variant_id,
    productId: r.product_id,
    productName: r.product_name,
    productSlug: r.product_slug,
    sku: r.sku,
    colorName: r.color_name,
    colorHex: r.color_hex ?? '#000000',
    sizeName: r.size_name,
    quantity: Number(r.quantity),
    reserved: Number(r.reserved),
    available: Number(r.quantity) - Number(r.reserved),
    isLow: Number(r.quantity) - Number(r.reserved) <= LOW_STOCK_THRESHOLD,
  }))
}

export async function getVariantInventoryHistory(variantId: string): Promise<MovementHistoryRow[]> {
  const rows = await rawQuery<{
    id: string
    type: string
    quantity: number
    reason: string | null
    actor_email: string | null
    created_at: Date
  }>(sql`
    SELECT
      im.id,
      im.type,
      im.quantity,
      im.reason,
      u.email AS actor_email,
      im.created_at
    FROM inventory_movements im
    LEFT JOIN users u ON u.id = im.performed_by
    WHERE im.variant_id = ${variantId}
    ORDER BY im.created_at DESC
    LIMIT 100
  `)

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    quantity: Number(r.quantity),
    reason: r.reason,
    performedByEmail: r.actor_email,
    createdAt: new Date(r.created_at),
  }))
}

export async function getVariantDetail(variantId: string) {
  const rows = await rawQuery<{
    variant_id: string
    product_id: string
    product_name: string
    product_slug: string
    sku: string
    color_name: string
    color_hex: string | null
    size_name: string
    quantity: number
    reserved: number
  }>(sql`
    SELECT
      pv.id            AS variant_id,
      p.id             AS product_id,
      p.name           AS product_name,
      p.slug           AS product_slug,
      pv.sku           AS sku,
      c.name           AS color_name,
      c.hex            AS color_hex,
      s.name           AS size_name,
      COALESCE(i.quantity, 0) AS quantity,
      COALESCE(i.reserved, 0) AS reserved
    FROM product_variants pv
    JOIN products       p ON p.id  = pv.product_id
    JOIN colors         c ON c.id  = pv.color_id
    JOIN sizes          s ON s.id  = pv.size_id
    LEFT JOIN inventory i ON i.variant_id = pv.id
    WHERE pv.id = ${variantId}
    LIMIT 1
  `)

  if (!rows[0]) return null

  const r = rows[0]
  return {
    variantId: r.variant_id,
    productId: r.product_id,
    productName: r.product_name,
    productSlug: r.product_slug,
    sku: r.sku,
    colorName: r.color_name,
    colorHex: r.color_hex ?? '#000000',
    sizeName: r.size_name,
    quantity: Number(r.quantity),
    reserved: Number(r.reserved),
    available: Number(r.quantity) - Number(r.reserved),
    isLow: Number(r.quantity) - Number(r.reserved) <= LOW_STOCK_THRESHOLD,
  }
}

export async function bulkSetInventoryBySkus(
  items: { sku: string; quantity: number }[],
  actor: ActorContext,
): Promise<{ updated: number; failed: { sku: string; error: string }[] }> {
  const skus = items.map((i) => i.sku)

  const variantRows = await db
    .select({ id: productVariants.id, sku: productVariants.sku })
    .from(productVariants)
    .where(inArray(productVariants.sku, skus))

  const skuToVariantId = new Map(variantRows.map((r) => [r.sku, r.id]))

  let updated = 0
  const failed: { sku: string; error: string }[] = []

  for (const item of items) {
    const variantId = skuToVariantId.get(item.sku)
    if (!variantId) {
      failed.push({ sku: item.sku, error: 'SKU no encontrado' })
      continue
    }

    // Get current stock to compute delta
    const [current] = await rawQuery<{ quantity: number; reserved: number }>(
      sql`SELECT COALESCE(quantity, 0) AS quantity, COALESCE(reserved, 0) AS reserved FROM inventory WHERE variant_id = ${variantId} LIMIT 1`,
    )
    const currentQty = current ? Number(current.quantity) : 0
    const reserved = current ? Number(current.reserved) : 0
    const delta = item.quantity - currentQty

    if (item.quantity < reserved) {
      failed.push({
        sku: item.sku,
        error: `No se puede reducir por debajo de reservas activas (${reserved} uds.)`,
      })
      continue
    }

    try {
      await applyManualMovement(
        { variantId, type: 'correction', delta, reason: 'Importación masiva CSV' },
        actor,
      )
      updated++
    } catch (err) {
      failed.push({ sku: item.sku, error: err instanceof Error ? err.message : 'Error' })
    }
  }

  return { updated, failed }
}

export async function applyManualMovement(
  payload: ManualMovementPayload,
  actor: ActorContext,
): Promise<void> {
  const { variantId, type, delta, reason } = payload

  // neon-http does not support db.transaction() or FOR UPDATE.
  // Manual admin movements are low-frequency, so sequential reads + writes are acceptable here.
  const [current] = await rawQuery<{ id: string; quantity: number; reserved: number }>(
    sql`SELECT id, quantity, reserved FROM inventory WHERE variant_id = ${variantId} LIMIT 1`,
  )

  if (!current) {
    // Create inventory record if it doesn't exist yet
    const newQty = Math.max(0, delta)
    await db.insert(inventory).values({ variantId, quantity: newQty, reserved: 0 })

    await db.insert(inventoryMovements).values({
      variantId, type, quantity: delta, reason, performedBy: actor.actorId,
    })

    await db.insert(auditLog).values({
      actorId: actor.actorId,
      actorEmail: actor.actorEmail,
      action: 'inventory.manual_movement',
      resourceType: 'product_variant',
      resourceId: variantId,
      before: { quantity: 0, reserved: 0 },
      after: { quantity: newQty, reserved: 0, movementType: type, delta, reason },
      ip: actor.ip,
    })
    return
  }

  const newQty = Number(current.quantity) + delta

  if (newQty < 0) {
    throw new Error(`Stock insuficiente. Stock actual: ${current.quantity}, ajuste: ${delta}`)
  }

  if (Number(current.reserved) > newQty) {
    throw new Error(
      `No se puede reducir el stock por debajo de las reservas activas (${current.reserved} unidades reservadas)`,
    )
  }

  await db
    .update(inventory)
    .set({ quantity: newQty, updatedAt: new Date() })
    .where(sql`variant_id = ${variantId}`)

  await db.insert(inventoryMovements).values({
    variantId, type, quantity: delta, reason, performedBy: actor.actorId,
  })

  await db.insert(auditLog).values({
    actorId: actor.actorId,
    actorEmail: actor.actorEmail,
    action: 'inventory.manual_movement',
    resourceType: 'product_variant',
    resourceId: variantId,
    before: { quantity: current.quantity, reserved: current.reserved },
    after: { quantity: newQty, reserved: current.reserved, movementType: type, delta, reason },
    ip: actor.ip,
  })
}
