'use server'

import { createAdminClient, requireAdminOrRoles } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'

export type BrandFormData = {
  name: string
  logo_url: string | null
  is_active: boolean
  order: number
}

export type BrandActionResult = { error: string } | { success: true; id: string }

export async function saveBrand(
  data: BrandFormData,
  brandId?: string,
): Promise<BrandActionResult> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()

  const slug = brandId
    ? undefined
    : slugify(data.name)

  if (!brandId && slug) {
    const { data: existing } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', slug)
      .single()
    if (existing) return { error: 'Ya existe una marca con ese nombre (slug duplicado)' }
  }

  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    logo_url: data.logo_url || null,
    is_active: data.is_active,
    order: data.order,
  }
  if (!brandId) payload.slug = slug

  if (brandId) {
    const { error } = await supabase.from('brands').update(payload).eq('id', brandId)
    if (error) return { error: error.message }
  } else {
    const { data: created, error } = await supabase
      .from('brands')
      .insert(payload)
      .select('id')
      .single()
    if (error || !created) return { error: error?.message ?? 'Error al crear la marca' }
    brandId = (created as { id: string }).id
  }

  revalidatePath('/dashboard/marcas')
  revalidatePath('/marcas')
  revalidatePath('/', 'layout')

  return { success: true, id: brandId }
}

export async function deleteBrand(id: string): Promise<{ error?: string }> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()

  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', id)

  if (count && count > 0) {
    return { error: `No se puede eliminar: ${count} producto${count !== 1 ? 's' : ''} usan esta marca. Reasígnalos primero.` }
  }

  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/marcas')
  revalidatePath('/marcas')
  revalidatePath('/', 'layout')
  return {}
}

export async function toggleBrandStatus(id: string, isActive: boolean): Promise<void> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()
  await supabase.from('brands').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/dashboard/marcas')
  revalidatePath('/marcas')
  revalidatePath('/', 'layout')
}
