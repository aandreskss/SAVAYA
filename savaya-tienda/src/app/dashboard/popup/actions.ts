'use server'

/*
  ── SQL: ejecutar en Supabase SQL Editor ──────────────────────────────────────

  create table popup_config (
    id text primary key default 'main',
    is_active boolean default false,
    title text,
    subtitle text,
    body text,
    image_url text,
    cta_text text,
    cta_href text,
    discount_code text,
    delay_seconds int default 3,
    updated_at timestamptz default now()
  );

  alter table popup_config enable row level security;

  -- Lectura pública (para mostrarlo en la tienda)
  create policy "Public read" on popup_config
    for select using (true);

  -- Solo admin puede escribir
  create policy "Admin full access" on popup_config
    for all using (true) with check (true);

  ──────────────────────────────────────────────────────────────────────────────
*/

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PopupConfig } from '@/lib/types'

export type PopupFormData = {
  is_active: boolean
  title: string
  subtitle: string
  body: string
  image_url: string
  cta_text: string
  cta_href: string
  discount_code: string
  delay_seconds: number
}

export type ActionResult = { error: string } | { success: true }

export async function getPopupConfig(): Promise<PopupConfig | null> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('popup_config')
    .select('*')
    .eq('id', 'main')
    .single()
  return (data as PopupConfig | null) ?? null
}

export async function savePopupConfig(data: PopupFormData): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createAdminClient()

  const payload = {
    id: 'main',
    is_active: data.is_active,
    title: data.title.trim() || null,
    subtitle: data.subtitle.trim() || null,
    body: data.body.trim() || null,
    image_url: data.image_url.trim() || null,
    cta_text: data.cta_text.trim() || null,
    cta_href: data.cta_href.trim() || null,
    discount_code: data.discount_code.trim().toUpperCase() || null,
    delay_seconds: data.delay_seconds,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('popup_config')
    .upsert(payload, { onConflict: 'id' })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard/popup')
  return { success: true }
}

export async function togglePopupActive(isActive: boolean): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('popup_config')
    .upsert({ id: 'main', is_active: isActive, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard/popup')
  return { success: true }
}
