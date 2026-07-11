'use server'

import { createAdminClient, requireStrictAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GuideType = 'clothing' | 'shoes' | 'accessories'

export interface GuideData {
  headers: string[]
  rows: string[][]
}

export async function updateSizeGuide(type: GuideType, data: GuideData) {
  await requireStrictAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('size_guides')
    .upsert(
      { type, headers: data.headers, rows: data.rows, updated_at: new Date().toISOString() },
      { onConflict: 'type' }
    )
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
