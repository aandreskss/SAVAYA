import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/server'

export const getCurrency = cache(async (): Promise<string> => {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('store_settings')
      .select('store_currency')
      .eq('id', 'main')
      .single()
    return (data as { store_currency: string | null } | null)?.store_currency ?? 'EUR'
  } catch {
    return 'EUR'
  }
})
