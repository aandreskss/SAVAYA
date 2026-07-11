import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import { ORDER_STATUS_CONFIG } from '@/lib/constants'
import OrderStatusManager from '@/components/dashboard/pedidos/OrderStatusManager'
import OrderContactSync from '@/components/dashboard/pedidos/OrderContactSync'
import type { OrderStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ShippingAddress = {
  name: string
  address_line: string
  city: string
  department: string | null
  postal_code: string | null
  phone: string | null
}

type OrderItem = {
  id: string
  product_name: string
  variant_info: string
  quantity: number
  unit_price: number
  image_url: string | null
  product_variants: { sku: string | null } | null
}

type FullOrder = {
  id: string
  order_number: string
  email: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  shipping_address: ShippingAddress
  payment_method: string | null
  payment_id: string | null
  tracking_number: string | null
  notes: string | null
  created_at: string
  // payment proof
  payment_proof_url: string | null
  payment_transaction_id: string | null
  payment_date: string | null
  payment_account_holder: string | null
  // shipping
  shipping_proof_url: string | null
  shipping_notes: string | null
  order_items: OrderItem[]
}

type HistoryEntry = {
  id: string
  previous_status: string | null
  new_status: string
  note: string | null
  changed_at: string
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('orders').select('order_number').eq('id', id).single()
  return { title: `${data?.order_number ?? 'Pedido'} — Admin` }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR_CLASSES: Record<string, string> = {
  gray: 'bg-gray-bg text-gray-text',
  green: 'bg-green-50 text-green-700',
  blue: 'bg-blue-50 text-blue-700',
  red: 'bg-red-50 text-red-700',
  orange: 'bg-orange-50 text-orange-700',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: rawOrder }, { data: rawHistory }, { data: settings }] = await Promise.all([
    supabase.from('orders').select('*, order_items(*, product_variants(sku))').eq('id', id).single(),
    supabase
      .from('order_status_history')
      .select('id, previous_status, new_status, note, changed_at')
      .eq('order_id', id)
      .order('changed_at', { ascending: false }),
    supabase.from('store_settings').select('whatsapp_number').eq('id', 'main').single(),
  ])

  if (!rawOrder) notFound()

  const order = rawOrder as unknown as FullOrder
  const history = (rawHistory ?? []) as unknown as HistoryEntry[]

  const statusCfg = ORDER_STATUS_CONFIG[order.status]
  const statusColorClass = statusCfg
    ? STATUS_COLOR_CLASSES[statusCfg.color]
    : 'bg-gray-bg text-gray-text'

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/pedidos"
            className="flex items-center gap-1 text-xs text-gray-text hover:text-black transition-colors font-body mb-2"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver a pedidos
          </Link>
          <h1 className="text-xl font-heading font-bold text-black">{order.order_number}</h1>
          <p className="text-sm text-gray-text font-body mt-0.5">
            {formatDate(order.created_at)}
            {order.payment_method && (
              <span className="ml-2 capitalize">
                · {PAYMENT_LABELS[order.payment_method] || order.payment_method}
              </span>
            )}
          </p>
        </div>
        <span className={`text-xs font-heading font-semibold px-3 py-1.5 rounded ${statusColorClass}`}>
          {statusCfg?.label ?? order.status}
        </span>
      </div>

      {/* Main grid: Customer info (editable) + Status manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/*
          OrderContactSync manages shared name/phone state so that
          editing the customer address instantly updates the WA links.
        */}
        <OrderContactSync
          orderId={order.id}
          email={order.email}
          shippingAddress={order.shipping_address}
          trackingNumber={order.tracking_number}
          orderNumber={order.order_number}
          currentStatus={order.status}
          paymentMethod={order.payment_method}
          paymentProofUrl={order.payment_proof_url}
          paymentTransactionId={order.payment_transaction_id}
          paymentDate={order.payment_date}
          paymentAccountHolder={order.payment_account_holder}
          shippingProofUrl={order.shipping_proof_url}
          shippingNotes={order.shipping_notes}
        />

        {/* Status manager (manual overrides) */}
        <OrderStatusManager
          orderId={order.id}
          currentStatus={order.status}
          orderEmail={order.email}
          orderNumber={order.order_number}
          currentTrackingNumber={order.tracking_number}
        />
      </div>

      {/* Order items */}
      <div className="bg-white rounded border border-gray-light overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-light">
          <h2 className="text-sm font-heading font-semibold text-black">
            Productos del pedido
          </h2>
        </div>
        <div className="divide-y divide-gray-light">
          {order.order_items.map((item) => (
            <div key={item.id} className="px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded border border-gray-light overflow-hidden bg-gray-bg shrink-0">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.product_name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-text">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-black">{item.product_name}</p>
                <p className="text-xs text-gray-text font-body mt-0.5">{item.variant_info}</p>
                {item.product_variants?.sku && (
                  <p className="text-xs text-gray-text font-body mt-0.5">
                    Ref: <span className="font-medium text-black">{item.product_variants.sku}</span>
                  </p>
                )}
              </div>
              <div className="text-center shrink-0">
                <p className="text-[11px] text-gray-text font-body">Cant.</p>
                <p className="text-sm font-heading font-semibold text-black">{item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-gray-text font-body">P. unitario</p>
                <p className="text-xs font-body text-black">{formatPrice(item.unit_price)}</p>
              </div>
              <div className="text-right shrink-0 min-w-[80px]">
                <p className="text-[11px] text-gray-text font-body">Subtotal</p>
                <p className="text-sm font-heading font-semibold text-black">
                  {formatPrice(item.unit_price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Order summary */}
        <div className="bg-white rounded border border-gray-light p-5">
          <h2 className="text-sm font-heading font-semibold text-black mb-4">
            Resumen del pedido
          </h2>
          <dl className="space-y-2.5 text-sm font-body">
            <div className="flex justify-between">
              <dt className="text-gray-text">Subtotal</dt>
              <dd className="text-black">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-text">Envío</dt>
              <dd className="text-black">
                {order.shipping_cost === 0 ? (
                  <span className="text-green-600">Gratis</span>
                ) : (
                  formatPrice(order.shipping_cost)
                )}
              </dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-text">Descuento</dt>
                <dd className="text-sale">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-light">
              <dt className="font-heading font-bold text-black text-base">Total</dt>
              <dd className="font-heading font-bold text-black text-base">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>

          {order.payment_id && (
            <div className="mt-4 pt-4 border-t border-gray-light">
              <p className="text-[11px] text-gray-text font-body uppercase tracking-wider">
                ID de pago
              </p>
              <p className="text-xs font-body text-black mt-1 break-all">{order.payment_id}</p>
            </div>
          )}
        </div>

        {/* Status history */}
        <div className="bg-white rounded border border-gray-light p-5">
          <h2 className="text-sm font-heading font-semibold text-black mb-4">
            Historial de estados
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-text font-body">
              Sin historial registrado.{' '}
              <span className="text-[11px]">
                (Crea la tabla <code className="bg-gray-bg px-1 rounded">order_status_history</code> en Supabase para activarlo)
              </span>
            </p>
          ) : (
            <ol className="relative border-l border-gray-light ml-2 space-y-4">
              {history.map((entry) => {
                const cfg = ORDER_STATUS_CONFIG[entry.new_status as OrderStatus]
                return (
                  <li key={entry.id} className="ml-4">
                    <span className="absolute -left-[5px] w-2.5 h-2.5 bg-accent rounded-full border-2 border-white" />
                    <p className="text-sm font-heading font-semibold text-black">
                      {cfg?.label ?? entry.new_status}
                    </p>
                    {entry.previous_status && (
                      <p className="text-[11px] text-gray-text font-body">
                        Desde:{' '}
                        {ORDER_STATUS_CONFIG[entry.previous_status as OrderStatus]?.label ??
                          entry.previous_status}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-text font-body mt-0.5">
                      {new Date(entry.changed_at).toLocaleString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-black font-body mt-1 italic">{entry.note}</p>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

// Used for readable payment method names in the header
const PAYMENT_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  binance: 'Binance Pay',
  usdt: 'USDT (TRC20)',
  bank_transfer_ve: 'Transferencia bancaria',
  pago_movil: 'Pago móvil',
  efectivo: 'Efectivo',
}
