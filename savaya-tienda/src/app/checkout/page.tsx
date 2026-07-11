import { createAdminClient } from '@/lib/supabase/server'
import type { PaymentConfigDB, ShippingPrices } from '@/lib/types'
import { fetchBcvRate } from '@/lib/bcvRate'
import CheckoutClient from './CheckoutClient'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  let paymentConfig: PaymentConfigDB | null = null
  let enabledMethods: string[] | null = null
  let enabledShippingCompanies: string[] | null = null
  let shippingPrices: ShippingPrices | null = null
  let storeCurrency = 'EUR'
  let whatsappNumber = ''
  let wholesaleMinQty = 6
  try {
    const supabase = createAdminClient()
    // Use select('*') so the query doesn't fail when new columns haven't
    // propagated to the PostgREST schema cache yet.
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'main')
      .single()
    paymentConfig = (data?.payment_config as PaymentConfigDB | null) ?? null
    enabledMethods = (data?.enabled_payment_methods as string[] | null) ?? null
    enabledShippingCompanies = (data?.enabled_shipping_companies as string[] | null) ?? null
    storeCurrency = (data?.store_currency as string | null) ?? 'EUR'
    whatsappNumber = (data?.whatsapp_number as string | null) ?? ''
    wholesaleMinQty = (data?.wholesale_min_qty as number | null) ?? 6
    const raw = data?.shipping_prices as { agency?: Record<string, number>; delivery?: Record<string, number> } | null
    if (raw) {
      shippingPrices = {
        agency:   raw.agency   ?? {},
        delivery: raw.delivery ?? {},
      }
    }
  } catch {
    // Table or columns not ready — checkout works with hardcoded defaults
  }

  const bcvRate = await fetchBcvRate(storeCurrency)

  return (
    <CheckoutClient
      paymentConfig={paymentConfig}
      enabledMethods={enabledMethods}
      enabledShippingCompanies={enabledShippingCompanies}
      shippingPrices={shippingPrices}
      storeCurrency={storeCurrency}
      bcvRate={bcvRate}
      whatsappNumber={whatsappNumber}
      wholesaleMinQty={wholesaleMinQty}
    />
  )
}
