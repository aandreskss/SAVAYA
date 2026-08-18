import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/lib/db'
import { orders, orderStatusHistory } from '@/domains/orders/schema'
import { inventory, inventoryMovements } from '@/domains/inventory/schema'
import { eq, and, lte, sql } from 'drizzle-orm'

// Runs every hour via Upstash QStash (POST) or direct call (GET).
// Finds orders in pending_payment with an expired reservation and cancels them.
// Protected by x-cron-secret header.
// Uses sequential awaits — neon-http does not support db.transaction().

async function handler(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const headerSecret = request.headers.get('x-cron-secret')
    const urlSecret = new URL(request.url).searchParams.get('secret')
    if (headerSecret !== cronSecret && urlSecret !== cronSecret) {
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

  const failed: string[] = []

  for (const order of expiredOrders) {
    try {
      // Get reserved inventory movements for this order
      const reservations = await db
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
        await db.insert(inventoryMovements).values({
          variantId: reservation.variantId,
          type: 'reservation_release',
          quantity: reservation.quantity,
          reason: `Reserva expirada — pedido ${order.orderNumber}`,
          orderId: order.id,
        })

        await db
          .update(inventory)
          .set({ reserved: sql`GREATEST(0, ${inventory.reserved} - ${reservation.quantity})` })
          .where(eq(inventory.variantId, reservation.variantId))
      }

      // Transition order to cancelled
      await db
        .update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, order.id))

      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: 'pending_payment',
        toStatus: 'cancelled',
        reason: 'Reserva de inventario expirada — cancelado automáticamente',
      })
    } catch (err) {
      console.error(`Error expiring order ${order.orderNumber}:`, err)
      failed.push(order.orderNumber)
    }
  }

  return NextResponse.json({
    expired: expiredOrders.length - failed.length,
    failed: failed.length > 0 ? failed : undefined,
    orderNumbers: expiredOrders.map((o) => o.orderNumber),
  })
}

export { handler as GET, handler as POST }
