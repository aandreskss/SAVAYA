'use server'

import { createAdminClient, requireAdminOrRoles } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateVariantStock(
  variantId: string,
  newStock: number,
): Promise<{ error?: string }> {
  await requireAdminOrRoles('editor')

  if (!variantId || typeof newStock !== 'number' || newStock < 0 || !Number.isInteger(newStock)) {
    return { error: 'Stock inválido.' }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('product_variants')
    .update({ stock: newStock })
    .eq('id', variantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  revalidatePath('/dashboard/productos')
  return {}
}

export async function bulkUpdateStock(
  variantIds: string[],
  newStock: number,
): Promise<{ error?: string }> {
  await requireAdminOrRoles('editor')

  if (!variantIds.length) return { error: 'No hay variantes seleccionadas.' }
  if (typeof newStock !== 'number' || newStock < 0 || !Number.isInteger(newStock)) {
    return { error: 'Stock inválido.' }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('product_variants')
    .update({ stock: newStock })
    .in('id', variantIds)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  revalidatePath('/dashboard/productos')
  return {}
}
