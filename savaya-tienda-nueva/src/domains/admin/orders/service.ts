import { db, rawQuery } from '@/shared/lib/db'
import { sql, eq, and } from 'drizzle-orm'
import { orders, orderStatusHistory } from '@/domains/orders/schema'
import { paymentProofs } from '@/domains/payment-proofs/schema'
import { auditLog } from '@/domains/audit-log/schema'
import { isValidTransition, getTransitionErrorMessage, TERMINAL_STATES, canRevert, REVERT_TARGETS } from '@/domains/orders/state-machine'
import type { OrderStatus } from '@/domains/orders/state-machine'
import { inventory, inventoryMovements } from '@/domains/inventory/schema'
import { sendPaymentApproved, sendPaymentRejected } from '@/domains/notifications/service'

type ActorContext = {
  actorId: string
  actorEmail: string
  ip: string
}

export class OrderTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderTransitionError'
  }
}

// neon-http does not support db.transaction() or SELECT FOR UPDATE.
// All functions below use sequential awaits with optimistic checks instead.

export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  actor: ActorContext,
  reason?: string,
): Promise<void> {
  const [current] = await rawQuery<{ status: string }>(
    sql`SELECT status FROM orders WHERE id = ${orderId} LIMIT 1`,
  )

  if (!current) throw new OrderTransitionError('Pedido no encontrado')

  const fromStatus = current.status as OrderStatus
  if (!isValidTransition(fromStatus, toStatus)) {
    throw new OrderTransitionError(getTransitionErrorMessage(fromStatus, toStatus))
  }

  await db
    .update(orders)
    .set({ status: toStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus,
    toStatus,
    actorId: actor.actorId,
    reason: reason ?? null,
  })

  await db.insert(auditLog).values({
    actorId: actor.actorId,
    actorEmail: actor.actorEmail,
    action: 'order.status_transition',
    resourceType: 'order',
    resourceId: orderId,
    before: { status: fromStatus },
    after: { status: toStatus, reason: reason ?? null },
    ip: actor.ip,
  })

  // On terminal states, settle the inventory reservation.
  // delivered → deduct stock permanently (sale).
  // cancelled / refunded → just release the reservation (goods return to available).
  if (TERMINAL_STATES.has(toStatus)) {
    const reservations = await db
      .select({ variantId: inventoryMovements.variantId, quantity: inventoryMovements.quantity })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.orderId, orderId),
          eq(inventoryMovements.type, 'reservation'),
        ),
      )

    const movementType = toStatus === 'delivered' ? 'sale' : 'reservation_release'
    const movementReason =
      toStatus === 'delivered'
        ? 'Pedido entregado — venta confirmada'
        : toStatus === 'refunded'
          ? 'Pedido reembolsado — reserva liberada'
          : 'Pedido cancelado — reserva liberada'

    for (const reservation of reservations) {
      await db.insert(inventoryMovements).values({
        variantId: reservation.variantId,
        type: movementType,
        quantity: reservation.quantity,
        reason: movementReason,
        orderId,
      })

      if (toStatus === 'delivered') {
        await db
          .update(inventory)
          .set({
            quantity: sql`GREATEST(0, ${inventory.quantity} - ${reservation.quantity})`,
            reserved: sql`GREATEST(0, ${inventory.reserved} - ${reservation.quantity})`,
            updatedAt: new Date(),
          })
          .where(eq(inventory.variantId, reservation.variantId))
      } else {
        await db
          .update(inventory)
          .set({
            reserved: sql`GREATEST(0, ${inventory.reserved} - ${reservation.quantity})`,
            updatedAt: new Date(),
          })
          .where(eq(inventory.variantId, reservation.variantId))
      }
    }
  }
}

export async function approvePayment(
  proofId: string,
  orderId: string,
  actor: ActorContext,
): Promise<void> {
  const [proof] = await rawQuery<{ status: string }>(
    sql`SELECT status FROM payment_proofs WHERE id = ${proofId} AND order_id = ${orderId} LIMIT 1`,
  )

  if (!proof) throw new OrderTransitionError('Comprobante no encontrado')
  if (proof.status !== 'pending') {
    throw new OrderTransitionError(
      proof.status === 'approved'
        ? 'Este comprobante ya fue aprobado.'
        : 'Este comprobante ya fue rechazado — no se puede aprobar.',
    )
  }

  const [current] = await rawQuery<{ status: string }>(
    sql`SELECT status FROM orders WHERE id = ${orderId} LIMIT 1`,
  )
  if (!current) throw new OrderTransitionError('Pedido no encontrado')

  const fromStatus = current.status as OrderStatus
  if (!isValidTransition(fromStatus, 'paid')) {
    throw new OrderTransitionError(getTransitionErrorMessage(fromStatus, 'paid'))
  }

  await db
    .update(paymentProofs)
    .set({ status: 'approved', reviewedBy: actor.actorId, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(paymentProofs.id, proofId))

  await db
    .update(orders)
    .set({ status: 'paid', updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus,
    toStatus: 'paid',
    actorId: actor.actorId,
    reason: 'Pago aprobado por administrador',
  })

  await db.insert(auditLog).values({
    actorId: actor.actorId,
    actorEmail: actor.actorEmail,
    action: 'payment.approved',
    resourceType: 'payment_proof',
    resourceId: proofId,
    before: { proofStatus: 'pending', orderStatus: fromStatus },
    after: { proofStatus: 'approved', orderStatus: 'paid' },
    ip: actor.ip,
  })

  // Fire-and-forget: email notification + Meta CAPI Purchase
  rawQuery<{ order_number: string; total_usd: string; total_bs: string; customer_id: string; first_name: string; last_name: string; email: string }>(
    sql`SELECT o.order_number, o.total_usd, o.total_bs, o.customer_id,
               c.first_name, c.last_name, c.email
        FROM orders o JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ${orderId} LIMIT 1`,
  ).then(async ([row]) => {
    if (!row) return

    sendPaymentApproved({
      orderId,
      customerId: row.customer_id,
      orderNumber: row.order_number,
      customerName: `${row.first_name} ${row.last_name}`,
      customerEmail: row.email,
      totalUsd: Number(row.total_usd),
      totalBs: Number(row.total_bs),
      items: [],
    }).catch((e) => console.error('[notifications] payment approved email failed:', e))

    // Meta CAPI — server-side Purchase event
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN
    if (!pixelId || !accessToken) return

    const items = await rawQuery<{ sku: string; quantity: number }>(
      sql`SELECT COALESCE(pv.sku, '') AS sku, oi.quantity
          FROM order_items oi
          LEFT JOIN product_variants pv ON pv.id = oi.variant_id
          WHERE oi.order_id = ${orderId}`,
    ).catch(() => [] as { sku: string; quantity: number }[])

    fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: `order-${row.order_number}`,
            event_source_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
            action_source: 'website',
            user_data: {},
            custom_data: {
              value: Number(row.total_usd),
              currency: 'USD',
              order_id: row.order_number,
              content_ids: items.map((i) => i.sku).filter(Boolean),
              content_type: 'product',
              num_items: items.reduce((s, i) => s + i.quantity, 0),
            },
          }],
        }),
      },
    ).catch((e) => console.error('[analytics] CAPI purchase failed:', e))
  }).catch(() => {})
}

export async function rejectPayment(
  proofId: string,
  orderId: string,
  reason: string,
  actor: ActorContext,
): Promise<void> {
  const [proof] = await rawQuery<{ status: string }>(
    sql`SELECT status FROM payment_proofs WHERE id = ${proofId} AND order_id = ${orderId} LIMIT 1`,
  )

  if (!proof) throw new OrderTransitionError('Comprobante no encontrado')
  if (proof.status !== 'pending') {
    throw new OrderTransitionError(
      proof.status === 'rejected'
        ? 'Este comprobante ya fue rechazado.'
        : 'Este comprobante ya fue aprobado — no se puede rechazar.',
    )
  }

  const [current] = await rawQuery<{ status: string }>(
    sql`SELECT status FROM orders WHERE id = ${orderId} LIMIT 1`,
  )
  if (!current) throw new OrderTransitionError('Pedido no encontrado')

  const fromStatus = current.status as OrderStatus
  if (!isValidTransition(fromStatus, 'payment_rejected')) {
    throw new OrderTransitionError(getTransitionErrorMessage(fromStatus, 'payment_rejected'))
  }

  await db
    .update(paymentProofs)
    .set({
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: actor.actorId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(paymentProofs.id, proofId))

  await db
    .update(orders)
    .set({ status: 'payment_rejected', updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus,
    toStatus: 'payment_rejected',
    actorId: actor.actorId,
    reason,
  })

  await db.insert(auditLog).values({
    actorId: actor.actorId,
    actorEmail: actor.actorEmail,
    action: 'payment.rejected',
    resourceType: 'payment_proof',
    resourceId: proofId,
    before: { proofStatus: 'pending', orderStatus: fromStatus },
    after: { proofStatus: 'rejected', orderStatus: 'payment_rejected', reason },
    ip: actor.ip,
  })

  // Fire-and-forget notification
  rawQuery<{ order_number: string; customer_id: string; first_name: string; last_name: string; email: string }>(
    sql`SELECT o.order_number, o.customer_id, c.first_name, c.last_name, c.email
        FROM orders o JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ${orderId} LIMIT 1`,
  ).then(([row]) => {
    if (!row) return
    sendPaymentRejected({
      orderId,
      customerId: row.customer_id,
      orderNumber: row.order_number,
      customerName: `${row.first_name} ${row.last_name}`,
      customerEmail: row.email,
      reason,
    }).catch((e) => console.error('[notifications] payment rejected email failed:', e))
  }).catch(() => {})
}

export async function revertOrderStatus(
  orderId: string,
  actor: ActorContext,
  reason?: string,
): Promise<void> {
  const [current] = await rawQuery<{ status: string }>(
    sql`SELECT status FROM orders WHERE id = ${orderId} LIMIT 1`,
  )
  if (!current) throw new OrderTransitionError('Pedido no encontrado')

  const fromStatus = current.status as OrderStatus
  if (!canRevert(fromStatus)) {
    throw new OrderTransitionError(`El pedido en estado "${fromStatus}" no puede revertirse`)
  }

  // Determine target state
  let toStatus: OrderStatus
  if (fromStatus === 'cancelled') {
    // Find the state from which it was cancelled
    const [lastEntry] = await rawQuery<{ from_status: string }>(
      sql`SELECT from_status FROM order_status_history
          WHERE order_id = ${orderId} AND to_status = 'cancelled'
          ORDER BY created_at DESC LIMIT 1`,
    )
    if (!lastEntry) throw new OrderTransitionError('No se puede determinar el estado previo del pedido cancelado')
    toStatus = lastEntry.from_status as OrderStatus
  } else {
    const target = REVERT_TARGETS[fromStatus]
    if (!target) throw new OrderTransitionError(`No existe estado anterior para: ${fromStatus}`)
    toStatus = target
  }

  await db
    .update(orders)
    .set({ status: toStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus,
    toStatus,
    actorId: actor.actorId,
    reason: reason ? `Revertido: ${reason}` : 'Estado revertido por administrador',
  })

  await db.insert(auditLog).values({
    actorId: actor.actorId,
    actorEmail: actor.actorEmail,
    action: 'order.status_reverted',
    resourceType: 'order',
    resourceId: orderId,
    before: { status: fromStatus },
    after: { status: toStatus, reason: reason ?? null },
    ip: actor.ip,
  })

  // If reverting from paid, the proof was approved — reset it so it can be approved again
  if (fromStatus === 'paid') {
    await db
      .update(paymentProofs)
      .set({ status: 'pending', reviewedBy: null, reviewedAt: null, updatedAt: new Date() })
      .where(and(eq(paymentProofs.orderId, orderId), eq(paymentProofs.status, 'approved')))
  }

  // Roll back inventory changes that were applied when entering the current terminal state
  if (TERMINAL_STATES.has(fromStatus)) {
    if (fromStatus === 'delivered') {
      // Undo sale movements: restore quantity and reserved
      const sales = await db
        .select({ variantId: inventoryMovements.variantId, quantity: inventoryMovements.quantity })
        .from(inventoryMovements)
        .where(and(eq(inventoryMovements.orderId, orderId), eq(inventoryMovements.type, 'sale')))

      for (const sale of sales) {
        await db.insert(inventoryMovements).values({
          variantId: sale.variantId,
          type: 'reservation',
          quantity: sale.quantity,
          reason: 'Entrega revertida — reserva restaurada',
          orderId,
        })
        await db
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} + ${sale.quantity}`,
            reserved: sql`${inventory.reserved} + ${sale.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(inventory.variantId, sale.variantId))
      }
    } else {
      // cancelled / refunded: undo reservation_release movements → restore reserved
      const releases = await db
        .select({ variantId: inventoryMovements.variantId, quantity: inventoryMovements.quantity })
        .from(inventoryMovements)
        .where(and(eq(inventoryMovements.orderId, orderId), eq(inventoryMovements.type, 'reservation_release')))

      for (const release of releases) {
        await db.insert(inventoryMovements).values({
          variantId: release.variantId,
          type: 'reservation',
          quantity: release.quantity,
          reason: `${fromStatus === 'refunded' ? 'Reembolso' : 'Cancelación'} revertido — reserva restaurada`,
          orderId,
        })
        await db
          .update(inventory)
          .set({
            reserved: sql`${inventory.reserved} + ${release.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(inventory.variantId, release.variantId))
      }
    }
  }
}
