'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResult = { error: string } | { success: true; id: string }

const MAIN_CATEGORIES = [
  { type: 'clothing', name: 'Ropa', slug: 'ropa', order: 1 },
  { type: 'shoes', name: 'Zapatos', slug: 'zapatos', order: 2 },
  { type: 'accessories', name: 'Accesorios', slug: 'accesorios', order: 3 },
] as const

/**
 * 1. Creates the 3 main categories (Ropa/Zapatos/Accesorios) if any are missing (matched by slug).
 * 2. Fixes orphan subcategories: any root category with same product_type but different slug
 *    gets assigned parent_id pointing to the canonical main category.
 */
export async function repairCategoryHierarchy(): Promise<{ created: number; fixed: number; error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  // Step 1: ensure each canonical main category exists (check by slug, not product_type)
  let created = 0
  const mainIds: Record<string, string> = {}

  for (const mc of MAIN_CATEGORIES) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', mc.slug)
      .limit(1)

    if (existing && (existing as unknown[]).length > 0) {
      mainIds[mc.type] = (existing[0] as { id: string }).id
      // Make sure it has the right product_type and parent_id=null
      await supabase
        .from('categories')
        .update({ product_type: mc.type, parent_id: null, order: mc.order })
        .eq('slug', mc.slug)
    } else {
      const { data: inserted } = await supabase
        .from('categories')
        .insert({ name: mc.name, slug: mc.slug, product_type: mc.type, parent_id: null, order: mc.order })
        .select('id')
        .single()
      if (inserted) mainIds[mc.type] = (inserted as { id: string }).id
      created++
    }
  }

  // Step 2: find all root categories that are NOT canonical and assign them a parent
  const { data: allRoots, error } = await supabase
    .from('categories')
    .select('id, slug, product_type')
    .is('parent_id', null)
    .not('product_type', 'is', null)

  if (error) return { created, fixed: 0, error: error.message }

  const canonicalSlugs = new Set<string>(MAIN_CATEGORIES.map((mc) => mc.slug))
  const orphans = (allRoots ?? []).filter(
    (cat) => !canonicalSlugs.has(cat.slug as string)
  )

  let fixed = 0
  for (const orphan of orphans) {
    const parentId = mainIds[orphan.product_type as string]
    if (!parentId) continue
    const { error: upErr } = await supabase
      .from('categories')
      .update({ parent_id: parentId })
      .eq('id', orphan.id)
    if (!upErr) fixed++
  }

  revalidatePath('/')
  revalidatePath('/dashboard/categorias')
  return { created, fixed }
}

export async function toggleCategory(key: string, isVisible: boolean) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('category_visibility')
    .upsert({ key, is_visible: isVisible }, { onConflict: 'key' })

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard/categorias')
}

export async function updateCategoryImage(id: string, imageUrl: string): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .update({ image_url: imageUrl })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/dashboard/categorias')
  return { success: true, id }
}
