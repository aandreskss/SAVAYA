import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchBcvRate } from '@/lib/bcvRate'
import VerificarPagoClient from './VerificarPagoClient'
import { CurrencyProvider } from '@/components/providers/CurrencyProvider'
import type { PaymentConfigDB } from '@/lib/types'

export default async function VerificarPagoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = createAdminClient()

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, total, divisa_total, payment_method, payment_proof_url, shipping_address, email')
      .eq('id', id)
      .single(),
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'main')
      .single(),
  ])

  if (!order) notFound()

  const addr = order.shipping_address as { name?: string; delivery_type?: string } | null
  const reservationPct = sp.pct ? parseInt(sp.pct) : (addr?.delivery_type === 'store' ? undefined : undefined)
  const amountDue = reservationPct ? Math.round(order.total * reservationPct) / 100 : order.total

  const storeCurrency = (settings?.store_currency as string | null) ?? 'EUR'
  const DIVISA_METHODS = ['zelle', 'binance', 'usdt']
  const isBcvMethod = !DIVISA_METHODS.includes(order.payment_method ?? '')
  const bcvRate = isBcvMethod ? await fetchBcvRate(storeCurrency) : null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center">
          <Link href="/" aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <CurrencyProvider currency={(settings?.store_currency as string | null) ?? 'EUR'}>
          <VerificarPagoClient
            orderId={order.id}
            orderNumber={order.order_number}
            total={order.total}
            divisaTotal={(order as { divisa_total?: number | null }).divisa_total ?? null}
            amountDue={amountDue}
            reservationPct={reservationPct}
            paymentMethod={order.payment_method ?? ''}
            customerName={addr?.name ?? ''}
            storeWhatsapp={settings?.whatsapp_number ?? '584141100100'}
            paymentConfig={(settings?.payment_config as PaymentConfigDB | null) ?? null}
            alreadySubmitted={!!order.payment_proof_url}
            appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ''}
            bcvRate={bcvRate}
          />
        </CurrencyProvider>
      </main>
    </div>
  )
}
