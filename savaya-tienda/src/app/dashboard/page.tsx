import Link from 'next/link'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'
import SalesChart from '@/components/dashboard/SalesChart'
import type { SalesDataPoint } from '@/components/dashboard/SalesChart'
import LowStockWidget from '@/components/dashboard/LowStockWidget'
import type { LowStockItem } from '@/components/dashboard/LowStockWidget'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function startOfDaysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(d: Date): Date {
  const end = new Date(d)
  end.setHours(23, 59, 59, 999)
  return end
}

// ─── Status labels & colors ───────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
  on_hold: 'En pausa',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-blue-50 text-blue-700',
  processing: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  returned: 'bg-orange-50 text-orange-700',
  on_hold: 'bg-orange-50 text-orange-700',
}

// ─── Types for low-stock query ────────────────────────────────────────────────

interface LowStockVariant {
  id: string
  size: string
  color: string
  stock: number
  sku: string
  products: { id: string; name: string; images: string[] } | null
}


interface RecentOrder {
  id: string
  order_number: string
  email: string
  status: string
  total: number
  created_at: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createAdminClient()

  // Get current user role to show role-specific shortcuts
  const userSupabase = await createClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  const { data: profile } = user
    ? await userSupabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const role = profile?.role ?? 'admin'

  const weekStart = startOfDaysAgo(6)

  const [
    { data: todayOrders },
    { count: totalProducts },
    { count: totalCustomers },
    { data: weekOrders },
    { data: recentOrders },
    { data: lowStockRaw },
  ] = await Promise.all([
    // Today's orders
    supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', startOfToday()),

    // Active products count
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // Customers count
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer'),

    // Last 7 days orders (for chart)
    supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', weekStart.toISOString())
      .not('status', 'in', '(cancelled,returned)')
      .order('created_at', { ascending: true }),

    // Recent 5 orders
    supabase
      .from('orders')
      .select('id, order_number, email, status, total, created_at')
      .order('created_at', { ascending: false })
      .limit(5),

    // Low stock variants (0 < stock < 5)
    supabase
      .from('product_variants')
      .select('id, size, color, stock, sku, products(id, name, images)')
      .gt('stock', 0)
      .lt('stock', 5)
      .order('stock', { ascending: true })
      .limit(8),
  ])

  // ── Computed today metrics ──────────────────────────────────────────────────

  const todaySales =
    todayOrders
      ?.filter((o) => o.status !== 'cancelled' && o.status !== 'returned')
      .reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0

  const todayOrderCount = todayOrders?.length ?? 0

  // ── Build chart data (group by day) ────────────────────────────────────────

  const chartData: SalesDataPoint[] = Array.from({ length: 7 }, (_, i) => {
    const dayStart = startOfDaysAgo(6 - i)
    const dayEnd = endOfDay(dayStart)
    const label = dayStart.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })

    const total =
      weekOrders
        ?.filter((o) => {
          const d = new Date(o.created_at)
          return d >= dayStart && d <= dayEnd
        })
        .reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0

    return { day: label, total }
  })

  const lowStockVariants = (lowStockRaw ?? []) as unknown as LowStockVariant[]

  const lowStockItems: LowStockItem[] = lowStockVariants.map(v => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    color: v.color,
    stock: v.stock,
    product_name: v.products?.name ?? v.sku,
  }))

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-heading font-bold text-black">Dashboard</h1>
        <p className="text-sm text-gray-text font-body mt-0.5">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Quick access — editor and gestor_pedidos */}
      {(role === 'editor' || role === 'gestor_pedidos') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {role === 'editor' && (
            <Link
              href="/dashboard/productos"
              className="flex items-center gap-4 bg-white rounded border border-gray-light p-5 hover:border-black transition-colors group"
            >
              <span className="w-12 h-12 rounded bg-gray-bg flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors text-gray-text">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
              </span>
              <div>
                <p className="font-heading font-bold text-sm text-black">Gestionar productos</p>
                <p className="text-xs text-gray-text mt-0.5">Crear, editar y organizar el catálogo</p>
              </div>
              <svg className="ml-auto text-gray-text group-hover:text-black transition-colors shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          {role === 'gestor_pedidos' && (
            <Link
              href="/dashboard/pedidos"
              className="flex items-center gap-4 bg-white rounded border border-gray-light p-5 hover:border-black transition-colors group"
            >
              <span className="w-12 h-12 rounded bg-gray-bg flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors text-gray-text">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12h6M9 16h4" />
                </svg>
              </span>
              <div>
                <p className="font-heading font-bold text-sm text-black">Gestionar pedidos</p>
                <p className="text-xs text-gray-text mt-0.5">Ver, procesar y actualizar pedidos</p>
              </div>
              <svg className="ml-auto text-gray-text group-hover:text-black transition-colors shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          label="Ventas hoy"
          value={formatPrice(todaySales)}
          sub="pedidos pagados"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <MetricCard
          label="Pedidos nuevos"
          value={String(todayOrderCount)}
          sub="hoy"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          }
        />
        <MetricCard
          label="Productos activos"
          value={String(totalProducts ?? 0)}
          sub="en catálogo"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          }
        />
        <MetricCard
          label="Clientes"
          value={String(totalCustomers ?? 0)}
          sub="registrados"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
      </div>

      {/* Chart + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sales chart */}
        <div className="lg:col-span-2 bg-white rounded border border-gray-light p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-heading font-semibold text-black">Ventas — últimos 7 días</h2>
            <span className="text-xs text-gray-text font-body">
              Total:{' '}
              <span className="font-semibold text-black">
                {formatPrice(chartData.reduce((s, d) => s + d.total, 0))}
              </span>
            </span>
          </div>
          <SalesChart data={chartData} />
        </div>

        {/* Low stock */}
        <div className="bg-white rounded border border-gray-light p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-heading font-semibold text-black">Stock bajo</h2>
            {lowStockItems.length > 0 && (
              <span className="text-[10px] font-body text-gray-text">clic en stock para editar</span>
            )}
          </div>
          <LowStockWidget items={lowStockItems} />
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded border border-gray-light p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-heading font-semibold text-black">Últimos pedidos</h2>
          <a
            href="/dashboard/pedidos"
            className="text-xs text-gray-text hover:text-black transition-colors font-body underline underline-offset-2"
          >
            Ver todos
          </a>
        </div>

        {!recentOrders?.length ? (
          <p className="text-sm text-gray-text font-body py-4 text-center">No hay pedidos aún.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="text-[11px] text-gray-text font-heading font-semibold uppercase tracking-wider border-b border-gray-light">
                  <th className="text-left pb-2.5 pr-4 pl-1">Pedido</th>
                  <th className="text-left pb-2.5 pr-4">Cliente</th>
                  <th className="text-left pb-2.5 pr-4">Estado</th>
                  <th className="text-left pb-2.5 pr-4">Fecha</th>
                  <th className="text-right pb-2.5 pr-1">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-light">
                {(recentOrders as RecentOrder[]).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-bg/60 transition-colors">
                    <td className="py-3 pr-4 pl-1 font-heading font-semibold text-black text-xs">
                      {order.order_number}
                    </td>
                    <td className="py-3 pr-4 text-gray-text max-w-[180px] truncate">
                      {order.email}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-heading font-semibold ${
                          STATUS_COLORS[order.status as OrderStatus] ?? 'bg-gray-bg text-gray-text'
                        }`}
                      >
                        {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-text text-xs">{formatDate(order.created_at)}</td>
                    <td className="py-3 pr-1 text-right font-heading font-semibold text-black text-xs">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded border border-gray-light p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] text-gray-text font-heading font-semibold uppercase tracking-wider leading-tight">
          {label}
        </p>
        <span className="text-gray-text/50 shrink-0">{icon}</span>
      </div>
      <p className="text-2xl font-heading font-bold text-black mt-3 leading-none">{value}</p>
      <p className="text-xs text-gray-text font-body mt-1.5">{sub}</p>
    </div>
  )
}
