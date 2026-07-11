'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PaymentConfigDB, ShippingPrices } from '@/lib/types'

interface SaveSettingsData {
  whatsapp_number: string
  store_email: string
  store_address: string
  store_city: string
  store_department: string
  payment_config: PaymentConfigDB
  enabled_payment_methods: string[]
  enabled_shipping_companies: string[]
  shipping_prices: ShippingPrices
  wholesale_min_qty: number
  store_currency: string
}

export async function saveStoreSettings(data: SaveSettingsData): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    const base = {
      id: 'main',
      whatsapp_number: data.whatsapp_number.trim(),
      store_email: data.store_email.trim(),
      store_address: data.store_address.trim() || null,
      store_city: data.store_city.trim() || null,
      store_department: data.store_department.trim() || null,
      payment_config: data.payment_config,
      enabled_payment_methods: data.enabled_payment_methods,
      enabled_shipping_companies: data.enabled_shipping_companies,
      wholesale_min_qty: data.wholesale_min_qty,
      store_currency: data.store_currency,
      updated_at: new Date().toISOString(),
    }

    // Try full upsert including shipping_prices + store_currency
    const { error } = await supabase.from('store_settings').upsert({
      ...base,
      shipping_prices: data.shipping_prices,
    })

    if (error) {
      // shipping_prices column may not exist yet — try without it
      const { error: error2 } = await supabase.from('store_settings').upsert(base)
      if (error2) {
        // store_currency column may not exist yet — try without it
        const { store_currency: _sc, ...baseWithoutCurrency } = base
        void _sc
        const { error: error3 } = await supabase.from('store_settings').upsert(baseWithoutCurrency)
        if (error3) return { error: error3.message }
      }
    }

    revalidatePath('/dashboard/configuracion')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
