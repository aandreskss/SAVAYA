import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import DiscountForm from '@/components/dashboard/descuentos/DiscountForm'
import type { DiscountCode, DiscountType } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderRow = {
  id: string
  order_number: string
  email: string
  total: number
  discount: number
  status: string
  created_at: string
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createAdminClient()
  const { data } = await supabase.from('discount_codes').select('code').eq('id', id).single()
  return { title: `${data?.code ?? 'Código'} — Admin` }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EditarDescuentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: rawDiscount } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('id', id)
    .single()

  if (!rawDiscount) notFound()

  const discount = rawDiscount as unknown as DiscountCode

  // Try fetching orders that used this code (requires discount_code column on orders)
  let orders: OrderRow[] = []
  let ordersUnavailable = false

  try {
    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('id, order_number, email, total, discount, status, created_at')
      .eq('discount_code', discount.code)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      ordersUnavailable = true
    } else {
      orders = (rawOrders ?? []) as unknown as OrderRow[]
    }
  } catch {
    ordersUnavailable = true
  }

  const totalDiscounted = orders.reduce((sum, o) => sum + (o.discount ?? 0), 0)

  const isExpired = discount.expires_at && new Date(discount.expires_at) < new Date()
  const effectiveStatus = isExpired ? 'expired' : discount.is_active ? 'active' : 'inactive'
  const remainingUses =
    discount.max_uses != null ? Math.max(0, discount.max_uses - discount.used_count) : null
  const usagePercent = discount.max_uses
    ? Math.min(100, (discount.used_count / discount.max_uses) * 100)
    : null

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/descuentos"
          className="flex items-center gap-1 text-xs text-gray-text hover:text-black transition-colors font-body mb-2"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Volver a códigos
        </Link>
        <h1 className="text-xl font-heading font-bold text-black tracking-widest">{discount.code}</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uses */}
        <div className="bg-white rounded border border-gray-light p-4">
          <p className="text-[11px] text-gray-text font-body uppercase tracking-wider mb-1">Usos</p>
          <p className="text-2xl font-heading font-bold text-black">{discount.used_count}</p>
          {discount.max_uses != null && (
            <>
              <p className="text-[11px] text-gray-text font-body mt-0.5">
                de {discount.max_uses} máx.
              </p>
              <div className="mt-2 h-1.5 w-full bg-gray-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </>
          )}
          {discount.max_uses == null && (
            <p className="text-[11px] text-gray-text font-body mt-0.5">ilimitado</p>
          )}
        </div>

        {/* Remaining */}
        <div className="bg-white rounded border border-gray-light p-4">
          <p className="text-[11px] text-gray-text font-body uppercase tracking-wider mb-1">Usos restantes</p>
          <p className="text-2xl font-heading font-bold text-black">
            {remainingUses != null ? remainingUses : '∞'}
          </p>
          <p className="text-[11px] text-gray-text font-body mt-0.5">
            {remainingUses === 0 ? 'Agotado' : 'disponibles'}
          </p>
        </div>

        {/* Total discounted */}
        <div className="bg-white rounded border border-gray-light p-4">
          <p className="text-[11px] text-gray-text font-body uppercase tracking-wider mb-1">Total descontado</p>
          <p className="text-xl font-heading font-bold text-black">
            {ordersUnavailable ? '—' : formatPrice(totalDiscounted)}
          </p>
          {ordersUnavailable && (
            <p className="text-[11px] text-gray-text font-body mt-0.5">Requiere configuración</p>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded border border-gray-light p-4">
          <p className="text-[11px] text-gray-text font-body uppercase tracking-wider mb-1">Estado</p>
          <div className="mt-1">
            <span
              className={`text-xs font-heading font-semibold px-2.5 py-1 rounded ${
                effectiveStatus === 'active'
                  ? 'bg-green-50 text-green-700'
                  : effectiveStatus === 'expired'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-bg text-gray-text'
              }`}
            >
              {effectiveStatus === 'active' ? 'Activo' : effectiveStatus === 'expired' ? 'Vencido' : 'Inactivo'}
            </span>
          </div>
          <p className="text-[11px] text-gray-text font-body mt-2">
            {discount.type === 'percentage' ? `${discount.value}%` : formatPrice(discount.value)} de descuento
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded border border-gray-light p-5">
        <h2 className="text-sm font-heading font-semibold text-black mb-5">Editar código</h2>
        <DiscountForm discount={discount} />
      </div>

      {/* Orders that used this code */}
      <div className="bg-white rounded border border-gray-light overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-light">
          <h2 className="text-sm font-heading font-semibold text-black">
            Pedidos que usaron este código
          </h2>
        </div>

        {ordersUnavailable ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-text font-body">
              Para ver los pedidos, vincula la columna en Supabase SQL Editor:
            </p>
            <code className="mt-3 block text-xs bg-gray-bg rounded px-4 py-3 text-black font-mono text-left max-w-lg mx-auto">
              {'alter table orders add column discount_code text\n  references discount_codes(code);\ncreate index on orders(discount_code);'}
            </code>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-text font-body">
              Ningún pedido ha usado este código todavía.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="border-b border-gray-light">
                <tr className="text-[11px] text-gray-text font-heading font-semibold uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Pedido</th>
                  <th className="text-left px-5 py-3">Cliente</th>
                  <th className="text-left px-5 py-3">Fecha</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Descuento</th>
                  <th className="text-right px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-light">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-bg/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/pedidos/${order.id}`}
                        className="font-heading font-semibold text-xs text-black hover:text-accent transition-colors"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-text text-xs">{order.email}</td>
                    <td className="px-5 py-3 text-gray-text text-xs">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-body text-gray-text">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-sale font-heading font-semibold">
                      −{formatPrice(order.discount)}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-heading font-semibold text-black">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {orders.length > 0 && (
                <tfoot className="border-t border-gray-light bg-gray-bg/30">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-xs font-heading font-semibold text-black">
                      Total ({orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'})
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-heading font-semibold text-sale">
                      −{formatPrice(totalDiscounted)}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-heading font-semibold text-black">
                      {formatPrice(orders.reduce((s, o) => s + o.total, 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
