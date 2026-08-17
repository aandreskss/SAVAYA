import { db } from '@/shared/lib/db'
import { sql } from 'drizzle-orm'
import type {
  AdminOrderListItem,
  AdminOrderDetail,
  AdminOrderFilters,
  AdminPaymentProof,
  AdminOrderStatusEvent,
  PendingPaymentItem,
} from './types'
import type { OrderStatus } from '@/domains/orders/state-machine'

const PAGE_SIZE = 20

export async function listAdminOrders(
  filters: AdminOrderFilters = {},
): Promise<{ items: AdminOrderListItem[]; total: number }> {
  const { status, search, page = 1 } = filters
  const offset = (page - 1) * PAGE_SIZE

  const statusFilter = status ? sql`AND o.status = ${status}` : sql``
  const searchFilter = search
    ? sql`AND (
        o.order_number ILIKE ${'%' + search + '%'}
        OR c.email      ILIKE ${'%' + search + '%'}
        OR c.first_name ILIKE ${'%' + search + '%'}
        OR c.last_name  ILIKE ${'%' + search + '%'}
      )`
    : sql``

  const rows = await db.execute<{
    id: string
    order_number: string
    customer_first_name: string
    customer_last_name: string
    customer_email: string
    created_at: Date
    total_usd: string
    total_bs: string
    payment_method_name: string | null
    status: string
    proof_status: string | null
  }>(sql`
    SELECT
      o.id,
      o.order_number,
      c.first_name        AS customer_first_name,
      c.last_name         AS customer_last_name,
      c.email             AS customer_email,
      o.created_at,
      o.total_usd,
      o.total_bs,
      pm.name             AS payment_method_name,
      o.status,
      latest_proof.status AS proof_status
    FROM orders o
    JOIN customers c            ON c.id  = o.customer_id
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    LEFT JOIN LATERAL (
      SELECT status
      FROM payment_proofs pp
      WHERE pp.order_id = o.id
      ORDER BY pp.created_at DESC
      LIMIT 1
    ) latest_proof ON TRUE
    WHERE TRUE
      ${statusFilter}
      ${searchFilter}
    ORDER BY o.created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `)

  const [{ count }] = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE TRUE
      ${statusFilter}
      ${searchFilter}
  `)

  return {
    items: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customerName: `${r.customer_first_name} ${r.customer_last_name}`,
      customerEmail: r.customer_email,
      createdAt: r.created_at,
      totalUsd: r.total_usd,
      totalBs: r.total_bs,
      paymentMethodName: r.payment_method_name ?? null,
      status: r.status as OrderStatus,
      proofStatus: (r.proof_status as AdminOrderListItem['proofStatus']) ?? null,
    })),
    total: Number(count),
  }
}

export async function getAdminOrderByNumber(
  orderNumber: string,
): Promise<AdminOrderDetail | null> {
  const [order] = await db.execute<{
    id: string
    order_number: string
    status: string
    customer_id: string
    customer_first_name: string
    customer_last_name: string
    customer_email: string
    customer_phone: string | null
    customer_whatsapp: string | null
    subtotal_usd: string
    discount_usd: string
    shipping_cost_usd: string
    total_usd: string
    total_bs: string
    exchange_rate_snapshot: string
    reservation_payment_type: string | null
    shipping_snapshot: Record<string, unknown> | null
    notes: string | null
    payment_method_name: string | null
    created_at: Date
    updated_at: Date
  }>(sql`
    SELECT
      o.id,
      o.order_number,
      o.status,
      c.id            AS customer_id,
      c.first_name    AS customer_first_name,
      c.last_name     AS customer_last_name,
      c.email         AS customer_email,
      c.phone         AS customer_phone,
      c.whatsapp      AS customer_whatsapp,
      o.subtotal_usd,
      o.discount_usd,
      o.shipping_cost_usd,
      o.total_usd,
      o.total_bs,
      o.exchange_rate_snapshot,
      o.reservation_payment_type,
      o.shipping_snapshot,
      o.notes,
      pm.name         AS payment_method_name,
      o.created_at,
      o.updated_at
    FROM orders o
    JOIN customers c             ON c.id  = o.customer_id
    LEFT JOIN payment_methods pm  ON pm.id = o.payment_method_id
    WHERE o.order_number = ${orderNumber}
    LIMIT 1
  `)

  if (!order) return null

  const [items, history, proof] = await Promise.all([
    db.execute<{
      id: string
      quantity: number
      unit_price_usd: string
      total_usd: string
      product_snapshot: Record<string, unknown>
    }>(sql`
      SELECT id, quantity, unit_price_usd, total_usd, product_snapshot
      FROM order_items
      WHERE order_id = ${order.id}
      ORDER BY created_at ASC
    `),

    db.execute<{
      id: string
      from_status: string | null
      to_status: string
      reason: string | null
      actor_email: string | null
      created_at: Date
    }>(sql`
      SELECT
        osh.id,
        osh.from_status,
        osh.to_status,
        osh.reason,
        u.email     AS actor_email,
        osh.created_at
      FROM order_status_history osh
      LEFT JOIN users u ON u.id = osh.actor_id
      WHERE osh.order_id = ${order.id}
      ORDER BY osh.created_at ASC
    `),

    db.execute<{
      id: string
      status: string
      amount_paid: string
      currency: string
      reference: string
      payment_date: string
      holder_name: string
      cloudinary_public_id: string | null
      rejection_reason: string | null
      reviewed_at: Date | null
      metadata: Record<string, unknown> | null
      payment_method_name: string
    }>(sql`
      SELECT
        pp.id,
        pp.status,
        pp.amount_paid,
        pp.currency,
        pp.reference,
        pp.payment_date,
        pp.holder_name,
        pp.cloudinary_public_id,
        pp.rejection_reason,
        pp.reviewed_at,
        pp.metadata,
        pm.name AS payment_method_name
      FROM payment_proofs pp
      JOIN payment_methods pm ON pm.id = pp.payment_method_id
      WHERE pp.order_id = ${order.id}
      ORDER BY pp.created_at DESC
      LIMIT 1
    `),
  ])

  const latestProof = proof[0] ?? null

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status as OrderStatus,
    customer: {
      id: order.customer_id,
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: order.customer_email,
      phone: order.customer_phone,
      whatsapp: order.customer_whatsapp,
    },
    items: items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      unitPriceUsd: i.unit_price_usd,
      totalUsd: i.total_usd,
      productSnapshot: (i.product_snapshot ?? {}) as Record<string, unknown>,
    })),
    subtotalUsd: order.subtotal_usd,
    discountUsd: order.discount_usd,
    shippingCostUsd: order.shipping_cost_usd,
    totalUsd: order.total_usd,
    totalBs: order.total_bs,
    exchangeRateSnapshot: order.exchange_rate_snapshot,
    reservationPaymentType: order.reservation_payment_type,
    shippingSnapshot: order.shipping_snapshot,
    notes: order.notes,
    paymentMethodName: order.payment_method_name,
    statusHistory: history.map((h) => ({
      id: h.id,
      fromStatus: (h.from_status as OrderStatus | null) ?? null,
      toStatus: h.to_status as OrderStatus,
      reason: h.reason,
      actorEmail: h.actor_email,
      createdAt: h.created_at,
    })) satisfies AdminOrderStatusEvent[],
    proof: latestProof
      ? {
          id: latestProof.id,
          orderId: order.id,
          status: latestProof.status as AdminPaymentProof['status'],
          amountPaid: latestProof.amount_paid,
          currency: latestProof.currency,
          reference: latestProof.reference,
          paymentDate: latestProof.payment_date,
          holderName: latestProof.holder_name,
          cloudinaryPublicId: latestProof.cloudinary_public_id,
          rejectionReason: latestProof.rejection_reason,
          reviewedAt: latestProof.reviewed_at,
          metadata: latestProof.metadata,
          paymentMethodName: latestProof.payment_method_name,
        }
      : null,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  }
}

export async function getPendingPayments(): Promise<PendingPaymentItem[]> {
  const rows = await db.execute<{
    order_id: string
    order_number: string
    customer_first_name: string
    customer_last_name: string
    customer_email: string
    total_usd: string
    total_bs: string
    order_created_at: Date
    proof_id: string
    proof_status: string
    amount_paid: string
    currency: string
    reference: string
    payment_date: string
    holder_name: string
    cloudinary_public_id: string | null
    rejection_reason: string | null
    reviewed_at: Date | null
    metadata: Record<string, unknown> | null
    payment_method_name: string
  }>(sql`
    SELECT
      o.id            AS order_id,
      o.order_number,
      c.first_name    AS customer_first_name,
      c.last_name     AS customer_last_name,
      c.email         AS customer_email,
      o.total_usd,
      o.total_bs,
      o.created_at    AS order_created_at,
      pp.id           AS proof_id,
      pp.status       AS proof_status,
      pp.amount_paid,
      pp.currency,
      pp.reference,
      pp.payment_date,
      pp.holder_name,
      pp.cloudinary_public_id,
      pp.rejection_reason,
      pp.reviewed_at,
      pp.metadata,
      pm.name         AS payment_method_name
    FROM orders o
    JOIN customers c             ON c.id  = o.customer_id
    JOIN payment_proofs pp        ON pp.order_id = o.id
    JOIN payment_methods pm       ON pm.id = pp.payment_method_id
    WHERE o.status = 'payment_under_review'
      AND pp.status = 'pending'
    ORDER BY o.created_at ASC
  `)

  return rows.map((r) => ({
    orderId: r.order_id,
    orderNumber: r.order_number,
    customerName: `${r.customer_first_name} ${r.customer_last_name}`,
    customerEmail: r.customer_email,
    totalUsd: r.total_usd,
    totalBs: r.total_bs,
    createdAt: r.order_created_at,
    proof: {
      id: r.proof_id,
      orderId: r.order_id,
      status: r.proof_status as AdminPaymentProof['status'],
      amountPaid: r.amount_paid,
      currency: r.currency,
      reference: r.reference,
      paymentDate: r.payment_date,
      holderName: r.holder_name,
      cloudinaryPublicId: r.cloudinary_public_id,
      rejectionReason: r.rejection_reason,
      reviewedAt: r.reviewed_at,
      metadata: r.metadata,
      paymentMethodName: r.payment_method_name,
    },
  }))
}

export async function getPaymentProofById(
  proofId: string,
): Promise<{ cloudinaryPublicId: string | null } | null> {
  const [row] = await db.execute<{ cloudinary_public_id: string | null }>(sql`
    SELECT cloudinary_public_id FROM payment_proofs WHERE id = ${proofId} LIMIT 1
  `)
  if (!row) return null
  return { cloudinaryPublicId: row.cloudinary_public_id }
}
