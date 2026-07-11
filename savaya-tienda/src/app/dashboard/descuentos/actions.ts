'use server'

/*
  ── SQL opcional: vincular pedidos a códigos (ejecutar en Supabase SQL Editor) ──

  alter table orders add column discount_code text references discount_codes(code);
  create index on orders(discount_code);

  Con esa columna, la vista de estadísticas mostrará la lista de pedidos que
  usaron cada código. Sin ella, el historial de pedidos no estará disponible
  pero el resto de la gestión funciona correctamente.
  ──────────────────────────────────────────────────────────────────────────────
*/

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DiscountType } from '@/lib/types'

export type DiscountFormData = {
  code: string
  type: DiscountType
  value: number
  min_purchase: number | null
  max_uses: number | null
  expires_at: string | null
  is_active: boolean
}

export type ActionResult = { error: string } | { success: true; id: string }

// ─── Save (create or update) ──────────────────────────────────────────────────

export async function saveDiscount(
  data: DiscountFormData,
  discountId?: string
): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createAdminClient()

  const payload = {
    code: data.code.toUpperCase().trim(),
    type: data.type,
    value: data.value,
    min_purchase: data.min_purchase ?? null,
    max_uses: data.max_uses ?? null,
    expires_at: data.expires_at ?? null,
    is_active: data.is_active,
  }

  if (discountId) {
    const { error } = await supabase
      .from('discount_codes')
      .update(payload)
      .eq('id', discountId)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/descuentos')
    revalidatePath(`/dashboard/descuentos/${discountId}`)
    return { success: true, id: discountId }
  }

  const { data: created, error } = await supabase
    .from('discount_codes')
    .insert(payload)
    .select('id')
    .single()

  if (error || !created) return { error: error?.message ?? 'Error al crear el código' }

  revalidatePath('/dashboard/descuentos')
  return { success: true, id: (created as { id: string }).id }
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleDiscountStatus(id: string, isActive: boolean): Promise<void> {
  await requireAdmin()
  const supabase = await createAdminClient()
  await supabase.from('discount_codes').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/dashboard/descuentos')
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteDiscount(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createAdminClient()
  const { error } = await supabase.from('discount_codes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/descuentos')
  return {}
}
