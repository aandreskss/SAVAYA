import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { getCurrency } from '@/lib/getCurrency'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ numero: string }> }

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const
type OrderStatus = typeof STATUS_STEPS[number] | 'cancelled' | 'returned'

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  pending:    { label: 'Pendiente de pago',  badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  paid:       { label: 'Pago recibido',      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  processing: { label: 'En preparación',     badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  shipped:    { label: 'En camino',          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  delivered:  { label: 'Entregado',          badgeClass: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:  { label: 'Cancelado',          badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  returned:   { label: 'Devuelto',           badgeClass: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const STEP_LABELS: Record<string, string> = {
  pending:    'Recibido',
  paid:       'Pago confirmado',
  processing: 'En preparación',
  shipped:    'En camino',
  delivered:  'Entregado',
}

const PAYMENT_LABELS: Record<string, string> = {
  zelle:            'Zelle',
  binance:          'Binance Pay',
  usdt:             'USDT (TRC20)',
  bank_transfer_ve: 'Transferencia bancaria',
  pago_movil:       'Pago móvil',
  efectivo:         'Efectivo',
}

const SHIPPING_LABELS: Record<string, string> = {
  standard:         'Envío estándar (3–5 días hábiles)',
  express:          'Envío express (1–2 días hábiles)',
  pickup:           'Retiro en tienda',
  cash_on_delivery: 'Pago en destino',
}

// ─── Data ───────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  product_name: string
  variant_info: string
  quantity: number
  unit_price: number
  image_url: string | null
}

interface Order {
  id: string
  order_number: string
  status: string
  email: string
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  payment_method: string | null
  payment_proof_url: string | null
  shipping_method: string | null
  shipping_address: {
    name?: string
    address_line?: string
    city?: string
    department?: string
    phone?: string
  } | null
  created_at: string
  items: OrderItem[]
}

async function fetchOrderByNumber(numero: string): Promise<Order | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, status, email, subtotal, shipping_cost, discount, total, payment_method, payment_proof_url, shipping_address, created_at')
      .eq('order_number', numero)
      .single()

    if (error || !order) return null

    const { data: items } = await supabase
      .from('order_items')
      .select('id, product_name, variant_info, quantity, unit_price, image_url')
      .eq('order_id', order.id)

    return { ...order, shipping_method: null, items: (items ?? []) as OrderItem[] }
  } catch {
    return null
  }
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params
  return { title: `Pedido ${decodeURIComponent(numero)} | Savaya` }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function TrackOrderPage({ params }: Props) {
  const { numero } = await params
  const orderNumber = decodeURIComponent(numero).toUpperCase()

  const [order, currency] = await Promise.all([
    fetchOrderByNumber(orderNumber),
    getCurrency(),
  ])

  return (
    <div className="min-h-screen bg-gray-bg/40">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-light">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
          <Link href="/" className="text-xs text-gray-text hover:text-black transition-colors">
            ← Volver a la tienda
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Seguimiento de pedido</h1>
        <p className="text-gray-text text-sm mb-8">
          Número de pedido:{' '}
          <span className="font-heading font-semibold text-black">{orderNumber}</span>
        </p>

        {!order ? (
          <NotFound orderNumber={orderNumber} />
        ) : (
          <OrderDetails order={order} currency={currency} />
        )}
      </main>
    </div>
  )
}

// ─── Not found ──────────────────────────────────────────────────────────────

function NotFound({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="bg-white border border-gray-light rounded-lg p-8 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-gray-bg flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-gray-text">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h2 className="font-heading font-bold text-lg mb-2">Pedido no encontrado</h2>
      <p className="text-sm text-gray-text mb-1">
        No encontramos ningún pedido con el número{' '}
        <span className="font-semibold text-black">{orderNumber}</span>.
      </p>
      <p className="text-xs text-gray-text mb-6">
        Verifica que el número esté escrito exactamente como aparece en tu correo de confirmación.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-2.5 bg-black text-white text-sm font-heading font-semibold rounded hover:bg-accent transition-colors"
      >
        Volver a la tienda
      </Link>
    </div>
  )
}

// ─── Order details ───────────────────────────────────────────────────────────

function OrderDetails({ order, currency }: { order: Order; currency: string }) {
  const status = order.status as OrderStatus
  const statusInfo = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const stepIndex = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])
  const isCancelledOrReturned = status === 'cancelled' || status === 'returned'

  const createdAt = new Date(order.created_at).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Left column */}
      <div className="flex flex-col gap-5">

        {/* Payment proof CTA — pending + digital + no proof yet */}
        {status === 'pending' && order.payment_method && order.payment_method !== 'efectivo' && !order.payment_proof_url && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-heading font-semibold text-amber-900">Falta enviar tu comprobante de pago</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Para procesar tu pedido necesitamos verificar tu pago.
              </p>
            </div>
            <Link
              href={`/pedido/${order.id}/verificar-pago`}
              className="shrink-0 inline-block px-4 py-2 bg-amber-900 text-white font-heading font-bold text-xs tracking-wider rounded hover:bg-black transition-colors"
            >
              Enviar comprobante →
            </Link>
          </div>
        )}

        {/* Payment proof received — in verification */}
        {status === 'pending' && order.payment_proof_url && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 flex items-start gap-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth={2} className="shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-heading font-semibold text-blue-800">Comprobante enviado — en verificación</p>
              <p className="text-xs text-blue-600 mt-0.5">Te notificaremos por WhatsApp cuando confirmemos tu pago.</p>
            </div>
          </div>
        )}

        {/* Status card */}
        <div className="bg-white border border-gray-light rounded-lg p-5">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-text font-heading uppercase tracking-widest mb-1">Estado del pedido</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-heading font-semibold border ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-gray-text">Realizado el {createdAt}</p>
          </div>

          {/* Progress steps */}
          {!isCancelledOrReturned && (
            <div className="mt-4">
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = stepIndex >= i
                  const isLast = i === STATUS_STEPS.length - 1
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-black text-white' : 'bg-gray-bg border border-gray-light text-gray-text'}`}>
                          {done ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          ) : (
                            <span className="text-[10px] font-bold">{i + 1}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-center mt-1 max-w-[52px] leading-tight text-gray-text hidden sm:block">
                          {STEP_LABELS[step]}
                        </span>
                      </div>
                      {!isLast && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${stepIndex > i ? 'bg-black' : 'bg-gray-light'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        {order.items.length > 0 && (
          <div className="bg-white border border-gray-light rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-light">
              <p className="font-heading font-bold text-sm">Productos</p>
            </div>
            <ul className="divide-y divide-gray-light">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-14 h-14 object-cover rounded bg-gray-bg shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-bg rounded shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-text mt-0.5">{item.variant_info}</p>
                    <p className="text-xs text-gray-text">Cant. {item.quantity}</p>
                  </div>
                  <p className="text-sm font-heading font-semibold shrink-0">
                    {formatPrice(item.unit_price * item.quantity, currency)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shipping address */}
        {order.shipping_address && (
          <div className="bg-white border border-gray-light rounded-lg p-5">
            <p className="font-heading font-bold text-sm mb-3">Dirección de entrega</p>
            <div className="text-sm text-gray-text space-y-0.5">
              {order.shipping_address.name && <p className="text-black font-medium">{order.shipping_address.name}</p>}
              {order.shipping_address.address_line && <p>{order.shipping_address.address_line}</p>}
              {(order.shipping_address.city || order.shipping_address.department) && (
                <p>{[order.shipping_address.city, order.shipping_address.department].filter(Boolean).join(', ')}</p>
              )}
              {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Right column — summary */}
      <div className="flex flex-col gap-5">
        <div className="bg-white border border-gray-light rounded-lg p-5">
          <p className="font-heading font-bold text-sm mb-4">Resumen del pedido</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-gray-text">Subtotal</span>
              <span>{formatPrice(order.subtotal, currency)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between gap-2 text-sale">
                <span>Descuento</span>
                <span>− {formatPrice(order.discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-gray-text">Envío</span>
              <span>{order.shipping_cost === 0 ? 'Gratis' : formatPrice(order.shipping_cost, currency)}</span>
            </div>
            <div className="flex justify-between gap-2 font-heading font-bold text-base border-t border-gray-light pt-2 mt-1">
              <span>Total</span>
              <span>{formatPrice(order.total, currency)}</span>
            </div>
          </div>

          {order.payment_method && (
            <div className="mt-4 pt-4 border-t border-gray-light">
              <p className="text-xs text-gray-text mb-1">Método de pago</p>
              <p className="text-sm font-medium">{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
            </div>
          )}

          {order.shipping_method && (
            <div className="mt-3">
              <p className="text-xs text-gray-text mb-1">Método de envío</p>
              <p className="text-sm font-medium">{SHIPPING_LABELS[order.shipping_method] ?? order.shipping_method}</p>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="bg-white border border-gray-light rounded-lg p-5 text-sm">
          <p className="font-heading font-bold mb-2">¿Necesitas ayuda?</p>
          <p className="text-gray-text text-xs mb-3">
            Si tienes dudas sobre tu pedido, escríbenos por WhatsApp con tu número de pedido.
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '584141100100'}?text=Hola%2C%20necesito%20ayuda%20con%20mi%20pedido%20${encodeURIComponent(order.order_number)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-xs font-heading font-semibold rounded hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
