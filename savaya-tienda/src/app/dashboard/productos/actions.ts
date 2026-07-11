'use server'

import { createAdminClient, requireAdminOrRoles } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { slugify, slugifyUnique } from '@/lib/utils'
import type { Gender, ProductType, ProductColorImages } from '@/lib/types'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type VariantInput = {
  productVariantId?: string
  size: string
  color: string
  color_hex: string
  stock: number
  sku: string
}

export type ProductFormData = {
  name: string
  slug: string
  description: string
  category_id: string
  brand_id: string | null
  gender: Gender
  type: ProductType
  base_price: number
  sale_price: number | null
  wholesale_price: number | null
  divisa_price: number | null
  wholesale_divisa_price: number | null
  is_new: boolean
  is_featured: boolean
  is_active: boolean
  tags: string[]
  images: string[]
  variants: VariantInput[]
  deletedVariantIds: string[]
  color_images: Record<string, string[]>
}

export type ActionResult = { error: string } | { success: true; id: string }

export type SubcategoryResult =
  | { error: string }
  | { success: true; category: { id: string; name: string; slug: string; gender: string; product_type: string } }

// ─── Save product (create or update) ─────────────────────────────────────────

export async function saveProduct(
  data: ProductFormData,
  productId?: string
): Promise<ActionResult> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()

  // Derive product type from category's product_type field (fallback to form value)
  let resolvedType: ProductType = data.type
  const { data: catRow } = await supabase
    .from('categories')
    .select('product_type')
    .eq('id', data.category_id)
    .single()
  if (catRow && (catRow as { product_type?: string }).product_type) {
    resolvedType = (catRow as { product_type: string }).product_type as ProductType
  }

  const payload = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    category_id: data.category_id,
    brand_id: data.brand_id || null,
    gender: data.gender,
    type: resolvedType,
    base_price: data.base_price,
    sale_price: data.sale_price || null,
    wholesale_price: data.wholesale_price || null,
    divisa_price: data.divisa_price || null,
    wholesale_divisa_price: data.wholesale_divisa_price || null,
    is_new: data.is_new,
    is_featured: data.is_featured,
    is_active: data.is_active,
    tags: data.tags,
    images: data.images,
  }

  let id: string

  if (productId) {
    const { error } = await supabase.from('products').update(payload).eq('id', productId)
    if (error) return { error: error.message }
    id = productId
  } else {
    const { data: created, error } = await supabase
      .from('products')
      .insert(payload)
      .select('id')
      .single()
    if (error || !created) return { error: error?.message ?? 'Error al crear el producto' }
    id = (created as { id: string }).id
  }

  // Delete removed variants
  if (data.deletedVariantIds.length > 0) {
    await supabase.from('product_variants').delete().in('id', data.deletedVariantIds)
  }

  // Update existing variants
  const toUpdate = data.variants.filter((v) => v.productVariantId)
  for (const v of toUpdate) {
    await supabase
      .from('product_variants')
      .update({ size: v.size, color: v.color, color_hex: v.color_hex, stock: v.stock, sku: v.sku })
      .eq('id', v.productVariantId!)
  }

  // Insert new variants
  const toInsert = data.variants.filter((v) => !v.productVariantId)
  if (toInsert.length > 0) {
    const { error } = await supabase.from('product_variants').insert(
      toInsert.map((v) => ({
        product_id: id,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex,
        stock: v.stock,
        sku: v.sku,
      }))
    )
    if (error) return { error: error.message }
  }

  // Sync color images
  const existingColors = new Set(data.variants.map((v) => v.color).filter(Boolean))
  const toUpsert = Object.entries(data.color_images)
    .filter(([color, imgs]) => existingColors.has(color) && imgs.length > 0)
    .map(([color, images]) => {
      const v = data.variants.find((x) => x.color === color)
      return { product_id: id, color, color_hex: v?.color_hex ?? '', images }
    })

  if (toUpsert.length > 0) {
    await supabase
      .from('product_color_images')
      .upsert(toUpsert, { onConflict: 'product_id,color' })
  }

  // Delete colors that were cleared or whose variant was removed
  const colorsToClear = Object.keys(data.color_images).filter(
    (color) => !existingColors.has(color) || !data.color_images[color]?.length
  )
  for (const color of colorsToClear) {
    await supabase
      .from('product_color_images')
      .delete()
      .eq('product_id', id)
      .eq('color', color)
  }

  revalidatePath('/dashboard/productos')
  revalidatePath(`/${data.slug}`)
  revalidatePath('/')

  return { success: true, id }
}

// ─── Toggle active status ─────────────────────────────────────────────────────

export async function toggleProductStatus(id: string, isActive: boolean): Promise<void> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()
  await supabase.from('products').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/dashboard/productos')
}

// ─── Duplicate product ────────────────────────────────────────────────────────

export async function duplicateProduct(id: string): Promise<ActionResult> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()

  type RawVariant = {
    id: string
    product_id: string
    size: string
    color: string
    color_hex: string
    stock: number
    sku: string
  }

  type RawProduct = {
    id: string
    created_at: string
    name: string
    slug: string
    description: string | null
    category_id: string
    gender: string
    type: string
    base_price: number
    sale_price: number | null
    is_new: boolean
    is_featured: boolean
    is_active: boolean
    images: string[]
    tags: string[]
    product_variants: RawVariant[]
  }

  const { data: raw, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', id)
    .single()

  if (error || !raw) return { error: 'Producto no encontrado' }

  const p = raw as unknown as RawProduct

  const { data: created, error: insertError } = await supabase
    .from('products')
    .insert({
      name: `${p.name} (copia)`,
      slug: slugifyUnique(p.name),
      description: p.description,
      category_id: p.category_id,
      gender: p.gender,
      type: p.type,
      base_price: p.base_price,
      sale_price: p.sale_price,
      is_new: p.is_new,
      is_featured: p.is_featured,
      is_active: false,
      images: p.images,
      tags: p.tags,
    })
    .select('id')
    .single()

  if (insertError || !created) return { error: insertError?.message ?? 'Error al duplicar' }

  const newId = (created as { id: string }).id

  if (p.product_variants?.length > 0) {
    await supabase.from('product_variants').insert(
      p.product_variants.map((v) => ({
        product_id: newId,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex,
        stock: v.stock,
        sku: `${v.sku}-COPY`,
      }))
    )
  }

  const { data: colorImgsData } = await supabase
    .from('product_color_images')
    .select('*')
    .eq('product_id', id)

  if (colorImgsData && colorImgsData.length > 0) {
    await supabase.from('product_color_images').insert(
      (colorImgsData as ProductColorImages[]).map((ci) => ({
        product_id: newId,
        color: ci.color,
        color_hex: ci.color_hex,
        images: ci.images,
      }))
    )
  }

  revalidatePath('/dashboard/productos')
  return { success: true, id: newId }
}

// ─── Create subcategory (inline from product form) ────────────────────────────

export async function createSubcategory(
  name: string,
  gender: Gender | null,   // null = para todos (unisex)
  productType: ProductType,
): Promise<SubcategoryResult> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()

  // Find the main (root) category for this product type
  const { data: existingMain } = await supabase
    .from('categories')
    .select('id')
    .is('parent_id', null)
    .eq('product_type', productType)
    .limit(1)

  const parentId = existingMain?.[0]?.id ?? null

  const genderSlug = gender
    ? (({ women: 'mujer', men: 'hombre', kids: 'ninos' } as Record<string, string>)[gender] ?? gender)
    : 'unisex'
  // Main category (first of its type): clean slug. Subcategory: slug with gender suffix.
  const slug = parentId ? `${slugify(name)}-${genderSlug}` : slugify(name)

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), slug, gender: gender ?? null, product_type: productType, parent_id: parentId, order: 99 })
    .select('id, name, slug, gender, product_type')
    .single()

  if (error) return { error: error.message }

  const cat = data as { id: string; name: string; slug: string; gender: string; product_type: string }

  revalidatePath('/')
  revalidatePath('/dashboard/productos')

  return { success: true, category: cat }
}

// ─── Delete products (bulk) ───────────────────────────────────────────────────

export async function deleteProducts(ids: string[]): Promise<{ error?: string }> {
  await requireAdminOrRoles('editor')
  if (!ids.length) return {}
  const supabase = await createAdminClient()

  // Collect variant IDs so we can clean up FK references before deleting
  const { data: variantRows } = await supabase
    .from('product_variants')
    .select('id')
    .in('product_id', ids)
  const variantIds = (variantRows ?? []).map((v) => (v as { id: string }).id)

  if (variantIds.length > 0) {
    // cart_items are ephemeral — delete them
    await supabase.from('cart_items').delete().in('variant_id', variantIds)
    // order_items keep their snapshot data (name, price) — just nullify the FK
    await supabase.from('order_items').update({ variant_id: null }).in('variant_id', variantIds)
  }

  // Remove color image sets (may not have CASCADE)
  await supabase.from('product_color_images').delete().in('product_id', ids)

  // Delete products — CASCADE removes product_variants automatically
  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/productos')
  revalidatePath('/')
  return {}
}

// ─── Delete subcategory ───────────────────────────────────────────────────────

export async function deleteSubcategory(id: string): Promise<ActionResult> {
  await requireAdminOrRoles('editor')
  const supabase = await createAdminClient()

  // Block deletion if any products reference this category
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    return { error: `No se puede eliminar: ${count} producto${count !== 1 ? 's' : ''} la están usando. Reasígnalos primero.` }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/dashboard/productos')

  return { success: true, id }
}
