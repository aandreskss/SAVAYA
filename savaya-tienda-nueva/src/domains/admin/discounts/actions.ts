'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from '@/domains/discounts-promotions/repository'
import { DiscountFormSchema } from '@/domains/discounts-promotions/validators'
import type { DiscountFormPayload } from '@/domains/discounts-promotions/validators'
import type { AdminDiscount, ActionResult } from './types'

async function getActor() {
  const session = await auth()
  if (!session?.user?.id) return null
  await headers()
  return {
    id: session.user.id,
    permissions: (session.user.permissions ?? []) as string[],
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createDiscountAction(
  payload: DiscountFormPayload,
): Promise<ActionResult<AdminDiscount>> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('promotions:write')) {
    return { success: false, error: 'Sin permiso para crear descuentos' }
  }

  const parsed = DiscountFormSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const discount = await createDiscount(parsed.data)
    revalidatePath('/admin/promociones')
    return { success: true, data: discount }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { success: false, error: 'Ya existe un descuento con ese código.' }
    }
    return { success: false, error: 'Error al crear el descuento' }
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateDiscountAction(
  id: string,
  payload: DiscountFormPayload,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('promotions:write')) {
    return { success: false, error: 'Sin permiso para editar descuentos' }
  }

  const parsed = DiscountFormSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await updateDiscount(id, parsed.data)
    revalidatePath('/admin/promociones')
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { success: false, error: 'Ya existe un descuento con ese código.' }
    }
    return { success: false, error: 'Error al actualizar el descuento' }
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteDiscountAction(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('promotions:write')) {
    return { success: false, error: 'Sin permiso para eliminar descuentos' }
  }

  try {
    await deleteDiscount(id)
    revalidatePath('/admin/promociones')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar el descuento' }
  }
}
