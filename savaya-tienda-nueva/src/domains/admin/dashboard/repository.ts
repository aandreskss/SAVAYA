import { db } from '@/shared/lib/db'
import { sql } from 'drizzle-orm'
import type {
  DashboardKPIs,
  SalesChartPoint,
  PendingPaymentItem,
  LowStockItem,
  TopProductItem,
  SalesByMethodItem,
} from './types'

type Row = Record<string, unknown>

function num(v: unknown): number {
  return parseFloat(String(v ?? '0')) || 0
}

function str(v: unknown): string {
  return String(v ?? '')
}

// ---------------------------------------------------------------------------
// KPIs — one SQL query with subquery for new customers
// ---------------------------------------------------------------------------

export async function getDashboardKPIs(start: Date, end: Date): Promise<DashboardKPIs> {
  if (!process.env.DATABASE_URL) return { revenue: 0, orderCount: 0, avgTicket: 0, uniqueCustomers: 0, newCustomers: 0 }

  try {
    const rows = await db.execute(sql`
      SELECT
        COALESCE(SUM(total_usd) FILTER (
          WHERE status IN ('paid', 'preparing', 'shipped', 'delivered')
        ), 0) AS revenue,
        COUNT(*) FILTER (
          WHERE status NOT IN ('cancelled', 'payment_rejected', 'pending_payment', 'payment_under_review', 'refunded')
        )::int AS order_count,
        COUNT(DISTINCT customer_id) FILTER (
          WHERE status NOT IN ('cancelled', 'payment_rejected', 'refunded')
        )::int AS unique_customers,
        (
          SELECT COUNT(DISTINCT o2.customer_id)::int
          FROM orders o2
          WHERE o2.created_at >= ${start} AND o2.created_at < ${end}
            AND NOT EXISTS (
              SELECT 1 FROM orders o3
              WHERE o3.customer_id = o2.customer_id
                AND o3.created_at < ${start}
            )
        ) AS new_customers
      FROM orders
      WHERE created_at >= ${start} AND created_at < ${end}
    `) as unknown as Row[]

    const row = rows[0] ?? {}
    const revenue = num(row.revenue)
    const orderCount = num(row.order_count)

    return {
      revenue,
      orderCount,
      avgTicket: orderCount > 0 ? revenue / orderCount : 0,
      uniqueCustomers: num(row.unique_customers),
      newCustomers: num(row.new_customers),
    }
  } catch (error) {
    console.error('[dashboard] getDashboardKPIs failed:', error)
    return { revenue: 0, orderCount: 0, avgTicket: 0, uniqueCustomers: 0, newCustomers: 0 }
  }
}

// ---------------------------------------------------------------------------
// Sales chart — daily breakdown
// ---------------------------------------------------------------------------

export async function getSalesChartData(start: Date, end: Date): Promise<SalesChartPoint[]> {
  if (!process.env.DATABASE_URL) return []

  try {
    const rows = await db.execute(sql`
      SELECT
        DATE(created_at AT TIME ZONE 'America/Caracas')::text AS day,
        COALESCE(SUM(total_usd), 0) AS revenue,
        COUNT(*)::int AS order_count
      FROM orders
      WHERE status IN ('paid', 'preparing', 'shipped', 'delivered')
        AND created_at >= ${start} AND created_at < ${end}
      GROUP BY day
      ORDER BY day
    `) as unknown as Row[]

    return rows.map((r) => ({
      day: str(r.day),
      revenue: num(r.revenue),
      orderCount: num(r.order_count),
    }))
  } catch (error) {
    console.error('[dashboard] getSalesChartData failed:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Pending payments — proofs with status='pending'
// ---------------------------------------------------------------------------

export async function getPendingPayments(): Promise<PendingPaymentItem[]> {
  if (!process.env.DATABASE_URL) return []

  try {
    const rows = await db.execute(sql`
      SELECT
        o.id AS order_id,
        o.order_number,
        o.total_usd,
        c.first_name || ' ' || c.last_name AS customer_name,
        pm.name AS payment_method_name,
        pp.id AS proof_id,
        pp.created_at AS submitted_at
      FROM payment_proofs pp
      JOIN orders o ON o.id = pp.order_id
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN payment_methods pm ON pm.id = pp.payment_method_id
      WHERE pp.status = 'pending'
        AND o.status = 'payment_under_review'
      ORDER BY pp.created_at ASC
      LIMIT 20
    `) as unknown as Row[]

    return rows.map((r) => ({
      orderId: str(r.order_id),
      orderNumber: str(r.order_number),
      totalUsd: num(r.total_usd),
      customerName: str(r.customer_name),
      paymentMethodName: str(r.payment_method_name) || 'Desconocido',
      proofId: str(r.proof_id),
      submittedAt: str(r.submitted_at),
    }))
  } catch (error) {
    console.error('[dashboard] getPendingPayments failed:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Low stock — available (quantity - reserved) <= threshold
// ---------------------------------------------------------------------------

const LOW_STOCK_THRESHOLD = 5

export async function getLowStockItems(): Promise<LowStockItem[]> {
  if (!process.env.DATABASE_URL) return []

  try {
    const rows = await db.execute(sql`
      SELECT
        pv.id AS variant_id,
        p.name AS product_name,
        pv.sku,
        col.name AS color_name,
        s.name AS size_name,
        (inv.quantity - inv.reserved) AS available
      FROM inventory inv
      JOIN product_variants pv ON pv.id = inv.variant_id AND pv.is_active = true
      JOIN products p ON p.id = pv.product_id AND p.is_active = true
      JOIN colors col ON col.id = pv.color_id
      JOIN sizes s ON s.id = pv.size_id
      WHERE (inv.quantity - inv.reserved) <= ${LOW_STOCK_THRESHOLD}
      ORDER BY (inv.quantity - inv.reserved) ASC
      LIMIT 30
    `) as unknown as Row[]

    return rows.map((r) => ({
      variantId: str(r.variant_id),
      productName: str(r.product_name),
      sku: str(r.sku),
      colorName: str(r.color_name),
      sizeName: str(r.size_name),
      available: num(r.available),
    }))
  } catch (error) {
    console.error('[dashboard] getLowStockItems failed:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Top products by revenue in period
// ---------------------------------------------------------------------------

export async function getTopProducts(start: Date, end: Date): Promise<TopProductItem[]> {
  if (!process.env.DATABASE_URL) return []

  try {
    const rows = await db.execute(sql`
      SELECT
        oi.product_snapshot->>'name' AS name,
        oi.product_snapshot->>'slug' AS slug,
        SUM(oi.total_usd) AS revenue,
        SUM(oi.quantity)::int AS units_sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('paid', 'preparing', 'shipped', 'delivered')
        AND o.created_at >= ${start} AND o.created_at < ${end}
      GROUP BY oi.product_snapshot->>'name', oi.product_snapshot->>'slug'
      ORDER BY revenue DESC
      LIMIT 10
    `) as unknown as Row[]

    return rows.map((r) => ({
      name: str(r.name),
      slug: r.slug ? str(r.slug) : null,
      revenue: num(r.revenue),
      unitsSold: num(r.units_sold),
    }))
  } catch (error) {
    console.error('[dashboard] getTopProducts failed:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Sales by payment method in period
// ---------------------------------------------------------------------------

export async function getSalesByMethod(start: Date, end: Date): Promise<SalesByMethodItem[]> {
  if (!process.env.DATABASE_URL) return []

  try {
    const rows = await db.execute(sql`
      SELECT
        pm.name AS method_name,
        pm.type AS method_type,
        COUNT(*)::int AS order_count,
        SUM(o.total_usd) AS revenue
      FROM orders o
      JOIN payment_methods pm ON pm.id = o.payment_method_id
      WHERE o.status IN ('paid', 'preparing', 'shipped', 'delivered')
        AND o.created_at >= ${start} AND o.created_at < ${end}
      GROUP BY pm.id, pm.name, pm.type
      ORDER BY revenue DESC
    `) as unknown as Row[]

    return rows.map((r) => ({
      methodName: str(r.method_name),
      methodType: str(r.method_type),
      orderCount: num(r.order_count),
      revenue: num(r.revenue),
    }))
  } catch (error) {
    console.error('[dashboard] getSalesByMethod failed:', error)
    return []
  }
}
