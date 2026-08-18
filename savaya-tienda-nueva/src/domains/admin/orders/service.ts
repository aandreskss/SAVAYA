'use server'

import { db, rawQuery } from '@/shared/lib/db'
import { sql } from 'drizzle-orm'
import { orders, orderStatusHistory } from '@/domains/orders/schema'
import { paymentProofs } from '@/domains/payment-proofs/schema'
import { auditLog } from '@/domains/audit-log/schema'
import { isValidTransition, getTransitionErrorMessage } from '@/domains/orders/state-machine'
import type { OrderStatus } from '@/domains/orders/state-machine'
import { eq } from 'drizzle-orm'
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

  // Fire-and-forget notification
  rawQuery<{ order_number: string; total_usd: string; total_bs: string; customer_id: string; first_name: string; last_name: string; email: string }>(
    sql`SELECT o.order_number, o.total_usd, o.total_bs, o.customer_id,
               c.first_name, c.last_name, c.email
        FROM orders o JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ${orderId} LIMIT 1`,
  ).then(([row]) => {
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
