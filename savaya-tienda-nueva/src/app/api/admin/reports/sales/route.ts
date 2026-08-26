import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'
import { rawQuery } from '@/shared/lib/db'
import { sql } from 'drizzle-orm'

function csvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    })
    .join(',')
}

function section(title: string, headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines: string[] = [title, csvRow(headers), ...rows.map(csvRow), '', '']
  return lines.join('\r\n')
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const from = sp.get('from') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const to = sp.get('to') ?? new Date().toISOString().slice(0, 10)
  const fromTs = `${from}T00:00:00Z`
  const toTs = `${to}T23:59:59Z`

  type SummaryRow = { total_orders: string; total_revenue: string; avg_order: string; total_customers: string; total_discount: string }
  type CityRow = { city: string; order_count: string; total_revenue: string }
  type ProductRow = { product_name: string; color: string; size: string; sku: string; units_sold: string; revenue: string }
  type MethodRow = { payment_method: string; order_count: string; total_revenue: string }
  type StatusRow = { status: string; order_count: string }
  type OrderRow = {
    order_number: string; created_at: Date; customer_name: string; status: string
    items_count: string; subtotal_usd: string; discount_usd: string; shipping_usd: string
    total_usd: string; payment_method: string; city: string
  }

  const [summary, cities, products, methods, statuses, orders] = await Promise.all([
    rawQuery<SummaryRow>(sql`
      SELECT
        COUNT(*)::text AS total_orders,
        COALESCE(SUM(total_usd), 0)::text AS total_revenue,
        COALESCE(AVG(total_usd), 0)::text AS avg_order,
        COUNT(DISTINCT customer_id)::text AS total_customers,
        COALESCE(SUM(discount_usd), 0)::text AS total_discount
      FROM orders
      WHERE created_at >= ${fromTs}::timestamptz AND created_at <= ${toTs}::timestamptz
    `),

    rawQuery<CityRow>(sql`
      SELECT
        COALESCE(sc.name, 'No especificada') AS city,
        COUNT(*)::text AS order_count,
        COALESCE(SUM(o.total_usd), 0)::text AS total_revenue
      FROM orders o
      LEFT JOIN shipping_cities sc ON sc.id = (o.shipping_snapshot->>'cityId')::uuid
      WHERE o.created_at >= ${fromTs}::timestamptz AND o.created_at <= ${toTs}::timestamptz
      GROUP BY sc.name
      ORDER BY SUM(o.total_usd) DESC NULLS LAST
    `),

    rawQuery<ProductRow>(sql`
      SELECT
        oi.product_snapshot->>'name' AS product_name,
        oi.product_snapshot->>'colorName' AS color,
        oi.product_snapshot->>'sizeName' AS size,
        oi.product_snapshot->>'sku' AS sku,
        SUM(oi.quantity)::text AS units_sold,
        SUM(oi.quantity * oi.unit_price_usd)::text AS revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= ${fromTs}::timestamptz AND o.created_at <= ${toTs}::timestamptz
      GROUP BY oi.product_snapshot->>'name', oi.product_snapshot->>'colorName', oi.product_snapshot->>'sizeName', oi.product_snapshot->>'sku'
      ORDER BY SUM(oi.quantity) DESC
      LIMIT 50
    `),

    rawQuery<MethodRow>(sql`
      SELECT
        COALESCE(pm.name, 'Desconocido') AS payment_method,
        COUNT(*)::text AS order_count,
        COALESCE(SUM(o.total_usd), 0)::text AS total_revenue
      FROM orders o
      LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
      WHERE o.created_at >= ${fromTs}::timestamptz AND o.created_at <= ${toTs}::timestamptz
      GROUP BY pm.name
      ORDER BY SUM(o.total_usd) DESC NULLS LAST
    `),

    rawQuery<StatusRow>(sql`
      SELECT status, COUNT(*)::text AS order_count
      FROM orders
      WHERE created_at >= ${fromTs}::timestamptz AND created_at <= ${toTs}::timestamptz
      GROUP BY status
      ORDER BY COUNT(*) DESC
    `),

    rawQuery<OrderRow>(sql`
      SELECT
        o.order_number,
        o.created_at,
        COALESCE(c.first_name || ' ' || c.last_name, 'Invitado') AS customer_name,
        o.status,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::text AS items_count,
        o.subtotal_usd::text,
        o.discount_usd::text,
        o.shipping_cost_usd::text AS shipping_usd,
        o.total_usd::text,
        COALESCE(pm.name, '') AS payment_method,
        COALESCE(sc.name, '') AS city
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
      LEFT JOIN shipping_cities sc ON sc.id = (o.shipping_snapshot->>'cityId')::uuid
      WHERE o.created_at >= ${fromTs}::timestamptz AND o.created_at <= ${toTs}::timestamptz
      ORDER BY o.created_at DESC
    `),
  ])

  const s = summary[0]
  const csvParts: string[] = [
    `REPORTE DE VENTAS SAVAYA — Período: ${from} al ${to}\r\n\r\n`,

    section('RESUMEN GENERAL', ['Métrica', 'Valor'], [
      ['Total de pedidos', s?.total_orders ?? '0'],
      ['Ingresos totales (USD)', `$${Number(s?.total_revenue ?? 0).toFixed(2)}`],
      ['Ticket promedio (USD)', `$${Number(s?.avg_order ?? 0).toFixed(2)}`],
      ['Clientes únicos', s?.total_customers ?? '0'],
      ['Descuentos aplicados (USD)', `$${Number(s?.total_discount ?? 0).toFixed(2)}`],
    ]),

    section('PEDIDOS POR CIUDAD', ['Ciudad', 'Pedidos', 'Ingresos (USD)'],
      cities.map((r) => [r.city, r.order_count, `$${Number(r.total_revenue).toFixed(2)}`]),
    ),

    section('VENTAS POR MÉTODO DE PAGO', ['Método', 'Pedidos', 'Ingresos (USD)'],
      methods.map((r) => [r.payment_method, r.order_count, `$${Number(r.total_revenue).toFixed(2)}`]),
    ),

    section('PEDIDOS POR ESTADO', ['Estado', 'Cantidad'],
      statuses.map((r) => [r.status, r.order_count]),
    ),

    section('TOP PRODUCTOS (unidades vendidas)', ['Producto', 'Color', 'Talla', 'SKU', 'Unidades', 'Ingresos (USD)'],
      products.map((r) => [
        r.product_name, r.color, r.size, r.sku,
        r.units_sold, `$${Number(r.revenue).toFixed(2)}`,
      ]),
    ),

    section('DETALLE DE PEDIDOS', ['Nº Pedido', 'Fecha', 'Cliente', 'Estado', 'Artículos', 'Subtotal', 'Descuento', 'Envío', 'Total', 'Método pago', 'Ciudad'],
      orders.map((r) => [
        r.order_number,
        new Date(r.created_at).toLocaleDateString('es-VE'),
        r.customer_name,
        r.status,
        r.items_count,
        `$${Number(r.subtotal_usd).toFixed(2)}`,
        `$${Number(r.discount_usd).toFixed(2)}`,
        `$${Number(r.shipping_usd).toFixed(2)}`,
        `$${Number(r.total_usd).toFixed(2)}`,
        r.payment_method,
        r.city,
      ]),
    ),
  ]

  const csv = csvParts.join('')
  const filename = `savaya-ventas-${from}-${to}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
