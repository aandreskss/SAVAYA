import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import ProductCard from '@/components/product/ProductCard'
import type { Product, ProductColorImages } from '@/lib/types'

async function attachVariants(supabase: ReturnType<typeof createAdminClient>, products: Product[]) {
  if (!products.length) return products
  const { data } = await supabase
    .from('product_variants')
    .select('*')
    .in('product_id', products.map((p) => p.id))
  const byProduct = new Map<string, Product['variants']>()
  for (const v of data ?? []) {
    const row = v as { product_id: string }
    if (!byProduct.has(row.product_id)) byProduct.set(row.product_id, [])
    byProduct.get(row.product_id)!.push(v as never)
  }
  return products.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }))
}

async function attachColorImages(supabase: ReturnType<typeof createAdminClient>, products: Product[]) {
  if (!products.length) return products
  const { data } = await supabase
    .from('product_color_images')
    .select('product_id, color, color_hex, images')
    .in('product_id', products.map((p) => p.id))
  const byProduct = new Map<string, ProductColorImages[]>()
  for (const r of data ?? []) {
    const row = r as { product_id: string; color: string; color_hex: string; images: string[] }
    if (!byProduct.has(row.product_id)) byProduct.set(row.product_id, [])
    byProduct.get(row.product_id)!.push({ id: '', ...row })
  }
  return products.map((p) => ({ ...p, color_images: byProduct.get(p.id) ?? [] }))
}

export default async function FeaturedCollection() {
  try {
    const supabase = createAdminClient()

    const { data: col } = await supabase
      .from('collections')
      .select('id, name, slug, description')
      .eq('show_on_home', true)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!col) return null
    const collection = col as { id: string; name: string; slug: string; description: string | null }

    // Get ordered product IDs from the collection
    const { data: items } = await supabase
      .from('collection_products')
      .select('product_id, display_order')
      .eq('collection_id', collection.id)
      .order('display_order', { ascending: true })
      .limit(8)

    if (!items || items.length === 0) return null

    const productIds = items.map((i) => (i as { product_id: string }).product_id)
    const orderMap = new Map(
      items.map((i) => {
        const row = i as { product_id: string; display_order: number }
        return [row.product_id, row.display_order]
      })
    )

    // Fetch full product data
    const { data: rawProducts } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true)

    if (!rawProducts || rawProducts.length === 0) return null

    // Attach variants and color images, preserve collection order
    const withVariants = await attachVariants(supabase, rawProducts as Product[])
    const products = (await attachColorImages(supabase, withVariants)).sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    )

    return (
      <section className="py-14 bg-white">
        <div className="px-4 md:px-8">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] font-heading font-bold uppercase tracking-[0.25em] text-gold mb-1.5">
                Colección especial
              </p>
              <h2 className="font-display text-2xl font-bold text-black">
                {collection.name}
              </h2>
              {collection.description && (
                <p className="text-gray-text mt-1 font-body text-sm max-w-md">{collection.description}</p>
              )}
            </div>
            <Link
              href={`/coleccion/${collection.slug}`}
              className="text-sm font-heading font-semibold text-gray-text hover:text-black underline underline-offset-2 transition-colors shrink-0 hidden sm:block"
            >
              Ver todo →
            </Link>
          </div>

          {/* Product grid — same layout as other home sections */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Mobile: horizontal scroll */}
          <div className="md:hidden flex gap-3 overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide snap-x snap-mandatory">
            {products.map((product) => (
              <div key={product.id} className="w-[47vw] min-w-[160px] max-w-[220px] shrink-0 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Mobile "ver todo" */}
          <div className="mt-6 text-center sm:hidden">
            <Link
              href={`/coleccion/${collection.slug}`}
              className="text-sm font-heading font-semibold text-accent hover:text-gold transition-colors"
            >
              Ver toda la colección →
            </Link>
          </div>
        </div>
      </section>
    )
  } catch {
    return null
  }
}
