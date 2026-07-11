'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface BannerData {
  image_url?: string | null
  title?: string | null
  subtitle?: string | null
  badge?: string | null
  cta_text?: string | null
  href?: string | null
  is_active?: boolean
  image_only?: boolean
}

export async function saveBanner(id: string, data: BannerData) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('banner_config').upsert({
    id,
    ...data,
    updated_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
