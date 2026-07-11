import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { getCurrency } from '@/lib/getCurrency'
import ConfettiCheck from './ConfettiCheck'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const currency = await getCurrency()

  // Try to load from Supabase; fall back to URL params (mock / post-redirect)
  let order: {
    orderNumber: string
    name: string
    email: string
    total: number
    method: string
    proofSubmitted?: boolean
    isStorePickup?: boolean
  } | null = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Get authenticated user (may be null for guest checkout)
      const { data: { user } } = await supabase.auth.getUser()

      const { data } = await supabase
        .from('orders')
        .select('order_number, email, total, payment_method, payment_proof_url, shipping_address')
        .eq('id', id)
        .single()

      if (data) {
        const addr = data.shipping_address as { name?: string; delivery_type?: string } | null
        const orderEmail = data.email as string

        // Authenticated user trying to view someone else's order → redirect
        if (user && user.email?.toLowerCase() !== orderEmail?.toLowerCase()) {
          redirect('/')
        }

        order = {
          orderNumber: data.order_number,
          name: addr?.name ?? '',
          // Only expose email to the owner; guests see a generic message
          email: user ? orderEmail : '',
          total: data.total,
          method: data.payment_method ?? '',
          proofSubmitted: !!data.payment_proof_url,
          isStorePickup: addr?.delivery_type === 'store',
        }
      }
    } catch (err) {
      // redirect() throws — let it propagate
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err
      // fall through to URL params
    }
  }

  // URL params fallback (mock mode or MP redirect)
  if (!order) {
    order = {
      orderNumber: sp.n ?? `TUL-${new Date().getFullYear()}-?????`,
      name: sp.name ?? '',
      email: sp.email ?? '',
      total: Number(sp.total ?? 0),
      method: sp.method ?? '',
      proofSubmitted: false,
      isStorePickup: sp.pickup === '1',
    }
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '584141100100'
  const whatsappMsg = encodeURIComponent(
    `Hola! Acabo de realizar el pedido *${order.orderNumber}* en Savaya y quiero coordinar el horario para ir a retirarlo y pagar. ¿Qué disponibilidad tienen?`
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`

  const deliveryDays = order.isStorePickup ? 'Retiro en tienda' : '3–5 días hábiles'

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal header */}
      <header className="border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center">
          <Link href="/" aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
        {/* Animated check */}
        <ConfettiCheck />

        <h1 className="font-display text-2xl md:text-3xl font-bold mt-8 mb-3">
          ¡Pedido confirmado!
        </h1>

        {/* Order status progress bar */}
        <OrderProgress />

        {order.name && (
          <p className="text-gray-text text-base mb-1">Gracias, {order.name.split(' ')[0]}.</p>
        )}

        <p className="text-gray-text mb-8">
          {order.email
            ? `Enviamos la confirmación a ${order.email}`
            : 'Hemos recibido tu pedido correctamente.'}
        </p>

        {/* Order card */}
        <div className="border border-gray-light rounded-lg text-left overflow-hidden mb-8">
          <div className="bg-gray-bg px-6 py-4 border-b border-gray-light">
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
              Número de pedido
            </p>
            <p className="font-heading font-bold text-lg mt-0.5">{order.orderNumber}</p>
          </div>

          <div className="px-6 py-4 flex flex-col gap-3 text-sm">
            <Row label="Total pagado" value={formatPrice(order.total, currency)} bold />
            <Row label="Tiempo estimado de entrega" value={deliveryDays} />
            {order.method === 'bank_transfer' && (
              <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-xs text-amber-800 mt-1">
                Recuerda enviar tu comprobante de pago a{' '}
                <span className="font-semibold">Savayarrss@gmail.com</span> con el número de pedido.
              </div>
            )}
          </div>
        </div>

        {/* Store pickup CTA */}
        {order.isStorePickup && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 mb-8 text-left">
            <p className="text-sm font-heading font-semibold text-green-900 mb-1">
              ¡Ya casi está! Coordina el horario de retiro
            </p>
            <p className="text-xs text-green-800 mb-3">
              Escríbenos por WhatsApp para confirmar cuándo puedes venir a retirar y pagar tu pedido en tienda.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-heading font-bold text-xs tracking-wider rounded hover:bg-green-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Notificar a la tienda por WhatsApp
            </a>
          </div>
        )}

        {/* Payment proof CTA — shown when digital payment and no proof yet */}
        {!order.isStorePickup && order.method && order.method !== 'efectivo' && !order.proofSubmitted && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 mb-8 text-left">
            <p className="text-sm font-heading font-semibold text-amber-900 mb-1">
              Falta enviar tu comprobante de pago
            </p>
            <p className="text-xs text-amber-700 mb-3">
              Para procesar tu pedido necesitamos verificar tu pago. Puedes hacerlo ahora o volver más tarde desde "Mis pedidos".
            </p>
            <Link
              href={`/pedido/${id}/verificar-pago`}
              className="inline-block px-4 py-2 bg-amber-900 text-white font-heading font-bold text-xs tracking-wider rounded hover:bg-black transition-colors"
            >
              Enviar comprobante →
            </Link>
          </div>
        )}

        {!order.isStorePickup && order.method && order.method !== 'efectivo' && order.proofSubmitted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 mb-8 text-left flex items-start gap-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth={2} className="shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-heading font-semibold text-blue-800">Comprobante enviado — en verificación</p>
              <p className="text-xs text-blue-600 mt-0.5">Te notificaremos por WhatsApp cuando confirmemos tu pago.</p>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-8 py-3.5 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
          >
            SEGUIR COMPRANDO
          </Link>
          <Link
            href={`/rastrear/${encodeURIComponent(order.orderNumber)}`}
            className="px-8 py-3.5 border-2 border-black font-heading font-bold text-sm tracking-widest rounded hover:bg-black hover:text-white transition-colors"
          >
            VER PEDIDO
          </Link>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-text">{label}</span>
      <span className={bold ? 'font-heading font-bold' : 'font-medium text-right'}>{value}</span>
    </div>
  )
}

const ORDER_STEPS = [
  { label: 'Recibido',    icon: '📋' },
  { label: 'En revisión', icon: '🔍' },
  { label: 'Preparando',  icon: '📦' },
  { label: 'Enviado',     icon: '🚚' },
  { label: 'Entregado',   icon: '✅' },
]

function OrderProgress() {
  return (
    <div className="w-full mb-8 mt-1">
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 mx-[10%] h-px bg-gray-light" aria-hidden />
        <div className="absolute top-4 left-0 h-px bg-black transition-all duration-700" style={{ width: '0%' }} aria-hidden />

        {ORDER_STEPS.map((step, i) => {
          const isActive = i === 0
          const isDone = false
          return (
            <div key={step.label} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors bg-white',
                  isActive ? 'border-black text-black' : isDone ? 'border-black bg-black text-white' : 'border-gray-light text-gray-text',
                ].join(' ')}
              >
                {isDone ? '✓' : step.icon}
              </div>
              <span className={['text-[9px] font-heading font-semibold text-center leading-tight', isActive ? 'text-black' : 'text-gray-text'].join(' ')}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
