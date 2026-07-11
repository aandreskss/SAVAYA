'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, requireAdmin } from '@/lib/supabase/server'

type SlideInput = {
  id?: string
  sort_order: number
  eyebrow: string
  title: string
  description: string
  cta: string
  href: string
  cta2: string
  href2: string
  image_url: string
  mobile_image_url: string
  image_href: string
  accent: string
  is_active: boolean
}

export async function saveHeroSlide(slide: SlideInput) {
  await requireAdmin()
  const supabase = createAdminClient()
  const payload = {
    sort_order: slide.sort_order,
    eyebrow: slide.eyebrow.trim(),
    title: slide.title.trim(),
    description: slide.description.trim(),
    cta: slide.cta.trim(),
    href: slide.href.trim(),
    cta2: slide.cta2.trim(),
    href2: slide.href2.trim(),
    image_url: slide.image_url.trim(),
    mobile_image_url: slide.mobile_image_url.trim(),
    image_href: slide.image_href.trim(),
    accent: slide.accent,
    is_active: slide.is_active,
    updated_at: new Date().toISOString(),
  }

  const isNew = !slide.id || slide.id.startsWith('_new')
  const { error } = isNew
    ? await supabase.from('hero_slides').insert(payload)
    : await supabase.from('hero_slides').update(payload).eq('id', slide.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/dashboard/hero')
  return { ok: true }
}

export async function deleteHeroSlide(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('hero_slides').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}

export async function updateSlidesOrder(ids: string[]) {
  await requireAdmin()
  const supabase = createAdminClient()
  await Promise.all(
    ids.map((id, index) =>
      supabase.from('hero_slides').update({ sort_order: index }).eq('id', id),
    ),
  )
  revalidatePath('/')
  return { ok: true }
}
