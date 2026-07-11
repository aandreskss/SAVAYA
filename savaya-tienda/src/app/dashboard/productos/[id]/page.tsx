import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import ProductForm from '@/components/dashboard/productos/ProductForm'
import type { Product, ProductVariant, Category, ProductColorImages } from '@/lib/types'

export const metadata: Metadata = { title: 'Editar producto — Admin' }

type ProductWithVariants = Product & { variants: ProductVariant[] }

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAdminClient()

  const [{ data: rawProduct }, { data: rawCategories }, { data: colorImgsData }, { data: brandsData }] = await Promise.all([
    supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('categories')
      .select('id, name, slug, gender, product_type')
      .order('name'),
    supabase
      .from('product_color_images')
      .select('*')
      .eq('product_id', id),
    supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true)
      .order('order')
      .order('name'),
  ])

  if (!rawProduct) notFound()

  const product: ProductWithVariants = {
    ...(rawProduct as unknown as ProductWithVariants),
    color_images: (colorImgsData ?? []) as ProductColorImages[],
  }
  const categories = (rawCategories ?? []) as unknown as { id: string; name: string; gender: string | null; slug: string; product_type: string }[]
  const brands = (brandsData ?? []) as { id: string; name: string }[]

  return (
    <div>
      <ProductForm categories={categories} brands={brands} product={product} />
    </div>
  )
}
