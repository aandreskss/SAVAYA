'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TagStyle = 'sale' | 'gold' | 'black' | 'accent' | 'white'

export interface CollectionProductInput {
  productId: string
  customTag: string
  tagStyle: TagStyle
  displayOrder: number
}

export async function listCollections() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, slug, is_active, show_on_home, nav_gender, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<{
    id: string; name: string; slug: string
    is_active: boolean; show_on_home: boolean
    nav_gender: string | null; created_at: string
  }>
}

export async function getCollectionWithProducts(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()
  const [{ data: col, error }, { data: prods }] = await Promise.all([
    supabase.from('collections').select('*').eq('id', id).single(),
    supabase
      .from('collection_products')
      .select('product_id, custom_tag, tag_style, display_order, products(id, name, slug, images, base_price, sale_price)')
      .eq('collection_id', id)
      .order('display_order', { ascending: true }),
  ])
  if (error) return null
  return { collection: col, products: (prods ?? []) as unknown as CollectionProductRow[] }
}

export interface CollectionProductRow {
  product_id: string
  custom_tag: string | null
  tag_style: string
  display_order: number
  products: {
    id: string; name: string; slug: string
    images: string[]; base_price: number; sale_price: number | null
  } | null
}

export async function saveCollection(formData: FormData): Promise<{ error?: string; id?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  const id = (formData.get('id') as string | null) || null
  const name = ((formData.get('name') as string) ?? '').trim()
  const slug = ((formData.get('slug') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const isActive = formData.get('is_active') === 'true'
  const showOnHome = formData.get('show_on_home') === 'true'
  const navGenderRaw = ((formData.get('nav_gender') as string) ?? '').trim()
  const navGender = navGenderRaw || null

  if (!name || !slug) return { error: 'Nombre y slug son requeridos' }

  if (showOnHome) {
    await supabase
      .from('collections')
      .update({ show_on_home: false })
      .neq('id', id ?? '00000000-0000-0000-0000-000000000000')
  }

  if (id) {
    const { error } = await supabase
      .from('collections')
      .update({ name, slug, description, is_active: isActive, show_on_home: showOnHome, nav_gender: navGender })
      .eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { data, error } = await supabase
      .from('collections')
      .insert({ name, slug, description, is_active: isActive, show_on_home: showOnHome, nav_gender: navGender })
      .select('id')
      .single()
    if (error) return { error: error.message }
    const newId = (data as { id: string }).id
    revalidatePath('/')
    revalidatePath('/dashboard/colecciones')
    return { id: newId }
  }

  revalidatePath('/')
  revalidatePath('/dashboard/colecciones')
  return { id: id ?? undefined }
}

export async function saveCollectionProducts(
  collectionId: string,
  products: CollectionProductInput[]
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  await supabase.from('collection_products').delete().eq('collection_id', collectionId)

  if (products.length > 0) {
    const { error } = await supabase.from('collection_products').insert(
      products.map((p) => ({
        collection_id: collectionId,
        product_id: p.productId,
        custom_tag: p.customTag || null,
        tag_style: p.tagStyle,
        display_order: p.displayOrder,
      }))
    )
    if (error) return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard/colecciones')
  return {}
}

export async function deleteCollection(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('collections').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/dashboard/colecciones')
  return {}
}

export async function toggleHomeCollection(id: string, show: boolean): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  if (show) {
    await supabase.from('collections').update({ show_on_home: false }).neq('id', id)
  }
  const { error } = await supabase.from('collections').update({ show_on_home: show }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/dashboard/colecciones')
  return {}
}
