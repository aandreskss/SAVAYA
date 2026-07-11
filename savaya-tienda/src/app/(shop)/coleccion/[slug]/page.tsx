import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { cn, formatPrice } from '@/lib/utils'
import { getCurrency } from '@/lib/getCurrency'
import CloudinaryImage from '@/components/ui/CloudinaryImage'

const TAG_CLASSES: Record<string, string> = {
  sale:   'bg-sale text-white',
  gold:   'bg-gold text-white',
  black:  'bg-black text-white',
  accent: 'bg-accent text-white',
  white:  'bg-white text-black',
}

interface CollectionProductItem {
  product_id: string
  custom_tag: string | null
  tag_style: string
  display_order: number
  products: {
    id: string; name: string; slug: string
    images: string[]; base_price: number; sale_price: number | null
  } | null
}

async function getCollection(slug: string) {
  const supabase = createAdminClient()
  const { data: col } = await supabase
    .from('collections')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!col) return null

  const { data: items } = await supabase
    .from('collection_products')
    .select('product_id, custom_tag, tag_style, display_order, products(id, name, slug, images, base_price, sale_price)')
    .eq('collection_id', col.id)
    .order('display_order', { ascending: true })

  return {
    collection: col as { id: string; name: string; slug: string; description: string | null },
    products: ((items ?? []) as unknown as CollectionProductItem[]).filter((i) => i.products),
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getCollection(slug)
  if (!data) return { title: 'Colección no encontrada' }
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'
  const description = data.collection.description ?? `Colección especial ${data.collection.name} en Savaya Venezuela.`
  return {
    title: `${data.collection.name} | Savaya`,
    description,
    alternates: { canonical: `${APP_URL}/coleccion/${slug}` },
    openGraph: {
      title: `${data.collection.name} | Savaya`,
      description,
      url: `${APP_URL}/coleccion/${slug}`,
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: `${data.collection.name} — Savaya` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.collection.name} | Savaya`,
    },
  }
}

export default async function ColeccionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [data, currency] = await Promise.all([getCollection(slug), getCurrency()])
  if (!data) notFound()

  const { collection, products } = data

  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <div className="bg-[#111111] py-16 px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-heading font-bold uppercase tracking-[0.25em] text-gold mb-3">
            Colección especial
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-white/60 font-body text-base">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 md:px-8 py-4 text-xs font-body text-gray-text flex items-center gap-1.5">
        <Link href="/" className="hover:text-black">Inicio</Link>
        <span>/</span>
        <span className="text-black">{collection.name}</span>
      </div>

      {/* Products */}
      <div className="px-4 md:px-8 pb-20">
        <p className="text-sm text-gray-text font-body mb-6">{products.length} producto{products.length !== 1 ? 's' : ''}</p>

        {products.length === 0 ? (
          <p className="text-center py-16 text-gray-text font-body">Esta colección está vacía.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map(({ product_id, custom_tag, tag_style, products: p }) => {
              if (!p) return null
              const tagClass = TAG_CLASSES[tag_style] ?? TAG_CLASSES.sale
              const img = p.images[0] ?? null
              return (
                <Link key={product_id} href={`/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded bg-white">
                    {img && (
                      <CloudinaryImage
                        contain
                        src={img}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain transition-opacity duration-300"
                      />
                    )}
                    {custom_tag && (
                      <div className={cn('absolute bottom-0 inset-x-0 z-10 py-3 text-center', tagClass)}>
                        <span className="font-heading font-black text-lg uppercase tracking-[0.15em]">
                          {custom_tag}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 space-y-0.5">
                    <p className="font-body text-sm line-clamp-1 group-hover:underline underline-offset-2">{p.name}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn('font-heading font-semibold text-sm', p.sale_price ? 'text-sale' : 'text-black')}>
                        {formatPrice(p.sale_price ?? p.base_price, currency)}
                      </span>
                      {p.sale_price && (
                        <span className="text-xs text-gray-text line-through">{formatPrice(p.base_price, currency)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
