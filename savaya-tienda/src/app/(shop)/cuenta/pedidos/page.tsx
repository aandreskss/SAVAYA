'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { useCurrency } from '@/components/providers/CurrencyProvider'
import type { OrderStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  product_name: string
  variant_info: string
  quantity: number
  unit_price: number
  image_url: string | null
}

interface OrderFull {
  id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  created_at: string
  payment_method: string | null
  payment_proof_url?: string | null
  tracking_number: string | null
  shipping_address: {
    name: string
    address_line: string
    city: string
    department?: string | null
    phone?: string | null
  }
  items: OrderItem[]
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-800' },
  paid:       { label: 'Pagado',      cls: 'bg-blue-100 text-blue-800' },
  processing: { label: 'En proceso',  cls: 'bg-blue-100 text-blue-800' },
  shipped:    { label: 'Enviado',     cls: 'bg-orange-100 text-orange-800' },
  delivered:  { label: 'Entregado',   cls: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Cancelado',   cls: 'bg-red-100 text-red-800' },
  returned:   { label: 'Devuelto',    cls: 'bg-orange-100 text-orange-800' },
  on_hold:    { label: 'En pausa',    cls: 'bg-orange-100 text-orange-800' },
}

const TIMELINE_STEPS: { label: string; reachedBy: OrderStatus[] }[] = [
  { label: 'Pedido recibido', reachedBy: ['pending', 'paid', 'processing', 'shipped', 'delivered'] },
  { label: 'Pago confirmado', reachedBy: ['paid', 'processing', 'shipped', 'delivered'] },
  { label: 'En preparación',  reachedBy: ['processing', 'shipped', 'delivered'] },
  { label: 'Enviado',         reachedBy: ['shipped', 'delivered'] },
  { label: 'Entregado',       reachedBy: ['delivered'] },
]

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: OrderFull[] = [
  {
    id: 'm1',
    order_number: 'TUL-2026-00123',
    status: 'delivered',
    subtotal: 189900,
    shipping_cost: 0,
    discount: 0,
    total: 189900,
    created_at: '2026-04-15T10:30:00Z',
    payment_method: 'Mercado Pago',
    tracking_number: 'TRK-789012',
    shipping_address: { name: 'Ana García', address_line: 'Calle 45 # 12-30', city: 'Bogotá', department: 'Cundinamarca', phone: '3001234567' },
    items: [
      { id: 'i1', product_name: 'Vestido floral primavera', variant_info: 'Talla M · Rosa', quantity: 1, unit_price: 129900, image_url: null },
      { id: 'i2', product_name: 'Sandalias planas', variant_info: 'Talla 37 · Beige', quantity: 1, unit_price: 60000, image_url: null },
    ],
  },
  {
    id: 'm2',
    order_number: 'TUL-2026-00089',
    status: 'shipped',
    subtotal: 95000,
    shipping_cost: 8900,
    discount: 0,
    total: 103900,
    created_at: '2026-05-02T14:00:00Z',
    payment_method: 'Transferencia bancaria',
    tracking_number: 'TRK-456789',
    shipping_address: { name: 'Carlos López', address_line: 'Carrera 70 # 45-10', city: 'Medellín', department: 'Antioquia', phone: '3109876543' },
    items: [
      { id: 'i3', product_name: 'Jeans slim fit', variant_info: 'Talla 32 · Azul', quantity: 1, unit_price: 95000, image_url: null },
    ],
  },
  {
    id: 'm3',
    order_number: 'TUL-2026-00067',
    status: 'pending',
    subtotal: 45000,
    shipping_cost: 8900,
    discount: 4500,
    total: 49400,
    created_at: '2026-05-10T09:15:00Z',
    payment_method: 'Mercado Pago',
    tracking_number: null,
    shipping_address: { name: 'María Torres', address_line: 'Av. 6 Norte # 38-10', city: 'Cali', department: 'Valle del Cauca', phone: null },
    items: [
      { id: 'i4', product_name: 'Bolso de cuero sintético', variant_info: 'Color Negro', quantity: 1, unit_price: 45000, image_url: null },
    ],
  },
  {
    id: 'm4',
    order_number: 'TUL-2026-00031',
    status: 'cancelled',
    subtotal: 78000,
    shipping_cost: 8900,
    discount: 0,
    total: 86900,
    created_at: '2026-03-22T11:00:00Z',
    payment_method: null,
    tracking_number: null,
    shipping_address: { name: 'Demo', address_line: '', city: 'Bogotá', department: null, phone: null },
    items: [
      { id: 'i5', product_name: 'Camiseta básica algodón', variant_info: 'Talla L · Blanco', quantity: 2, unit_price: 39000, image_url: null },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status] ?? STATUS.pending
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', s.cls)}>
      {s.label}
    </span>
  )
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'returned') {
    return (
      <div className="flex items-start gap-0">
        <TimelineStep done label="Pedido recibido" />
        <TimelineConnector done={false} />
        <TimelineStep done={false} cancelled label={status === 'cancelled' ? 'Cancelado' : 'Devuelto'} />
      </div>
    )
  }

  return (
    <div className="flex items-start gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = step.reachedBy.includes(status)
        const current = done && !TIMELINE_STEPS[i + 1]?.reachedBy.includes(status)
        return (
          <div key={step.label} className="flex items-start gap-0">
            <TimelineStep done={done} current={current} label={step.label} />
            {i < TIMELINE_STEPS.length - 1 && <TimelineConnector done={TIMELINE_STEPS[i + 1].reachedBy.includes(status)} />}
          </div>
        )
      })}
    </div>
  )
}

function TimelineStep({ done, current, cancelled, label }: { done: boolean; current?: boolean; cancelled?: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-16 md:w-20 shrink-0">
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors',
        cancelled ? 'border-sale bg-sale text-white' :
        done ? 'border-black bg-black text-white' :
        'border-gray-light bg-white',
      )}>
        {cancelled ? '✕' : done ? '✓' : ''}
      </div>
      <p className={cn('text-[10px] text-center leading-tight', cancelled ? 'text-sale' : done ? 'text-black' : 'text-gray-text')}>
        {label}
      </p>
    </div>
  )
}

function TimelineConnector({ done }: { done: boolean }) {
  return <div className={cn('h-0.5 w-6 md:w-8 mt-2.5 shrink-0 transition-colors', done ? 'bg-black' : 'bg-gray-light')} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PedidosPage() {
  const currency = useCurrency()
  const { user, isLoading } = useAuth()
  const [orders, setOrders] = useState<OrderFull[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!user?.id || !supabaseConfigured) {
      setOrders(MOCK_ORDERS)
      setLoadingOrders(false)
      return
    }
    const supabase = createClient()
    supabase
      .from('orders')
      .select(`
        id, order_number, status, subtotal, shipping_cost, discount, total,
        created_at, payment_method, payment_proof_url, tracking_number, shipping_address,
        items:order_items(id, product_name, variant_info, quantity, unit_price, image_url)
      `)
      .eq('email', user.email ?? '')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderFull[]) ?? [])
        setLoadingOrders(false)
      })
  }, [user?.id, user?.email, isLoading])

  if (isLoading || loadingOrders) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 bg-gray-bg rounded animate-pulse" />
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-bg rounded-lg animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="border border-gray-light rounded-lg px-6 py-16 text-center">
          <p className="text-gray-text">Aún no tienes pedidos realizados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const isOpen = expanded === order.id
            return (
              <div key={order.id} className="border border-gray-light rounded-lg overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-bg/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-4 items-center">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-semibold truncate">{order.order_number}</span>
                    </div>
                    <span className="text-xs text-gray-text hidden sm:block">{formatDate(order.created_at)}</span>
                    <span className="font-heading font-bold text-sm">{formatPrice(order.total, currency)}</span>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={cn('text-gray-text shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                  >
                    <polyline points="4 6 8 10 12 6" />
                  </svg>
                </button>

                {/* Detail */}
                {isOpen && (
                  <div className="border-t border-gray-light px-5 py-5 flex flex-col gap-6">
                    {/* Payment proof CTA */}
                    {order.status === 'pending' && order.payment_method && order.payment_method !== 'efectivo' && (
                      order.payment_proof_url ? (
                        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth={2} className="shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <div>
                            <p className="text-sm font-heading font-semibold text-blue-800">Comprobante enviado — en verificación</p>
                            <p className="text-xs text-blue-600 mt-0.5">Te notificaremos por WhatsApp cuando confirmemos tu pago.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#92400e" strokeWidth={2} className="shrink-0 mt-0.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-heading font-semibold text-amber-900">Pago pendiente de verificación</p>
                              <p className="text-xs text-amber-700 mt-0.5">Envía tu comprobante para que procesemos tu pedido.</p>
                            </div>
                          </div>
                          <Link
                            href={`/pedido/${order.id}/verificar-pago`}
                            className="shrink-0 px-3 py-1.5 bg-amber-900 text-white font-heading font-bold text-xs rounded hover:bg-black transition-colors whitespace-nowrap"
                          >
                            Enviar comprobante →
                          </Link>
                        </div>
                      )
                    )}

                    {/* Items */}
                    <div className="flex flex-col gap-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-14 h-[72px] rounded bg-gray-bg shrink-0 overflow-hidden relative">
                            {item.image_url && (
                              <Image src={item.image_url} alt={item.product_name} fill className="object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{item.product_name}</p>
                            <p className="text-xs text-gray-text mt-0.5">{item.variant_info}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-text">×{item.quantity}</span>
                              <span className="text-xs font-semibold">{formatPrice(item.unit_price * item.quantity, currency)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div className="overflow-x-auto">
                      <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-3">
                        Estado del pedido
                      </p>
                      <OrderTimeline status={order.status} />
                    </div>

                    {/* Summary grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2">
                          Dirección de envío
                        </p>
                        <p className="font-medium">{order.shipping_address.name}</p>
                        <p className="text-gray-text text-xs">{order.shipping_address.address_line}</p>
                        <p className="text-gray-text text-xs">
                          {order.shipping_address.city}
                          {order.shipping_address.department ? `, ${order.shipping_address.department}` : ''}
                        </p>
                        {order.shipping_address.phone && (
                          <p className="text-gray-text text-xs">{order.shipping_address.phone}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 text-xs">
                        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-0.5">
                          Detalle del pago
                        </p>
                        <Row label="Subtotal"   value={formatPrice(order.subtotal, currency)} />
                        {order.discount > 0 && (
                          <Row label="Descuento" value={`−${formatPrice(order.discount, currency)}`} className="text-sale" />
                        )}
                        <Row label="Envío"      value={order.shipping_cost === 0 ? 'Gratis' : formatPrice(order.shipping_cost, currency)} />
                        <Row label="Total"      value={formatPrice(order.total, currency)} bold />
                        {order.payment_method && (
                          <Row label="Método"   value={order.payment_method} />
                        )}
                        {order.tracking_number && (
                          <Row label="Guía"     value={order.tracking_number} />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className={cn('flex justify-between gap-2', className)}>
      <span className="text-gray-text">{label}</span>
      <span className={bold ? 'font-heading font-bold text-sm' : 'font-medium'}>{value}</span>
    </div>
  )
}
