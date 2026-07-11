import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import ProductForm from '@/components/dashboard/productos/ProductForm'

export const metadata: Metadata = { title: 'Nuevo producto — Admin' }

export default async function NuevoProductoPage() {
  const supabase = await createAdminClient()

  const [{ data: categoriesData }, { data: brandsData }] = await Promise.all([
    supabase.from('categories').select('id, name, slug, gender, product_type').order('name'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('order').order('name'),
  ])

  const categories = (categoriesData ?? []) as unknown as { id: string; name: string; gender: string | null; slug: string; product_type: string }[]
  const brands = (brandsData ?? []) as { id: string; name: string }[]

  return (
    <div>
      <ProductForm categories={categories} brands={brands} />
    </div>
  )
}
