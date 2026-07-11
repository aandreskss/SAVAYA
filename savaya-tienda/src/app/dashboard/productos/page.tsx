import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import ProductsTable, { type ProductRow } from '@/components/dashboard/productos/ProductsTable'
import type { Category } from '@/lib/types'

export const metadata: Metadata = { title: 'Productos — Admin' }

export default async function ProductosPage() {
  const supabase = await createAdminClient()

  const [{ data: rawProducts }, { data: categories }, { data: brands }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, description, images, tags, gender, type, base_price, sale_price, wholesale_price, divisa_price, wholesale_divisa_price, is_active, is_new, is_featured, created_at, category_id, brand_id, category:categories(name), brand:brands(name), product_variants(size, color, color_hex, sku, stock)')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name, gender, slug, product_type')
      .order('name'),
    supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  const products = (rawProducts ?? []) as unknown as ProductRow[]
  const cats = (categories ?? []) as unknown as Pick<Category, 'id' | 'name'>[]
  const brandList = (brands ?? []) as { id: string; name: string }[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-black">Productos</h1>
          <p className="text-sm text-gray-text font-body mt-0.5">
            {products.length} producto{products.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link
          href="/dashboard/productos/nuevo"
          className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo producto
        </Link>
      </div>

      <ProductsTable products={products} categories={cats} brands={brandList} />
    </div>
  )
}
