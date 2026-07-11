'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCustomSection(
  id: string,
  data: { title?: string | null; is_active?: boolean }
) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('custom_sections')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

interface CardInput {
  label: string
  href: string
  image_url: string | null
  display_order: number
}

export async function saveCustomSectionCards(sectionId: string, cards: CardInput[]) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error: delError } = await supabase
    .from('custom_section_cards')
    .delete()
    .eq('section_id', sectionId)
  if (delError) throw new Error(delError.message)

  if (cards.length > 0) {
    const { error: insError } = await supabase
      .from('custom_section_cards')
      .insert(cards.map((c) => ({ ...c, section_id: sectionId })))
    if (insError) throw new Error(insError.message)
  }

  revalidatePath('/', 'layout')
}

export async function saveCustomSectionFull(
  id: string,
  data: { title: string | null; cards: CardInput[] }
) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error: sectionError } = await supabase
    .from('custom_sections')
    .update({ title: data.title, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (sectionError) throw new Error(sectionError.message)

  const { error: delError } = await supabase
    .from('custom_section_cards')
    .delete()
    .eq('section_id', id)
  if (delError) throw new Error(delError.message)

  if (data.cards.length > 0) {
    const { error: insError } = await supabase
      .from('custom_section_cards')
      .insert(data.cards.map((c) => ({ ...c, section_id: id })))
    if (insError) throw new Error(insError.message)
  }

  // Only revalidate the shop homepage — do NOT use 'layout' scope, which would
  // also refresh /dashboard/categorias and re-mount SlotEditor before setSaved(true) runs.
  revalidatePath('/')
}
