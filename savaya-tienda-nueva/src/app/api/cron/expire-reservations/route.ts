import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/lib/db'
import { orders, orderStatusHistory } from '@/domains/orders/schema'
import { inventory, inventoryMovements } from '@/domains/inventory/schema'
import { eq, and, lte, sql } from 'drizzle-orm'

// GET /api/cron/expire-reservations
// Runs every hour via Vercel Cron Jobs.
// Finds orders in pending_payment with an expired reservation and cancels them.
// Protected by x-cron-secret header.

export async function GET(request: NextRequest) {
  // Auth: require cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const incomingSecret = request.headers.get('x-cron-secret')
    if (incomingSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ expired: 0, message: 'No DB configured — skipping' })
  }

  const now = new Date()

  // Find expired pending_payment orders
  const expiredOrders = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'pending_payment'),
        lte(orders.reservedUntil, now),
      ),
    )
    .limit(50) // process at most 50 per run to avoid timeout

  if (expiredOrders.length === 0) {
    return NextResponse.json({ expired: 0 })
  }

  // For each expired order, release inventory and cancel
  for (const order of expiredOrders) {
    try {
      await db.transaction(async (tx) => {
        // Get reserved inventory movements for this order
        // (cart may be cleared already; movements are the authoritative record)
        const reservations = await tx
          .select({
            variantId: inventoryMovements.variantId,
            quantity: inventoryMovements.quantity,
          })
          .from(inventoryMovements)
          .where(
            and(
              eq(inventoryMovements.orderId, order.id),
              eq(inventoryMovements.type, 'reservation'),
            ),
          )

        // Release each reservation
        for (const reservation of reservations) {
          // Insert release movement
          await tx.insert(inventoryMovements).values({
            variantId: reservation.variantId,
            type: 'reservation_release',
            quantity: reservation.quantity,
            reason: `Reserva expirada — pedido ${order.orderNumber}`,
            orderId: order.id,
          })

          // Decrement reserved
          await tx
            .update(inventory)
            .set({
              reserved: sql`GREATEST(0, ${inventory.reserved} - ${reservation.quantity})`,
            })
            .where(eq(inventory.variantId, reservation.variantId))
        }

        // Transition order to cancelled
        await tx
          .update(orders)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(orders.id, order.id))

        // Status history
        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          fromStatus: 'pending_payment',
          toStatus: 'cancelled',
          reason: 'Reserva de inventario expirada — cancelado automáticamente',
        })
      })
    } catch (err) {
      console.error(`Error expiring order ${order.orderNumber}:`, err)
    }
  }

  return NextResponse.json({
    expired: expiredOrders.length,
    orderNumbers: expiredOrders.map((o) => o.orderNumber),
  })
}
