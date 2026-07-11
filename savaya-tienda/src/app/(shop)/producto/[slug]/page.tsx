import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Product, ProductColorImages } from '@/lib/types'
import ProductPageClient from '@/components/product/ProductPageClient'
import ProductGrid from '@/components/product/ProductGrid'
import type { SizeGuideData } from '@/components/product/SizeGuide'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { FEATURED_PRODUCTS, NEW_ARRIVALS, SALE_PRODUCTS } = await import('@/lib/mock-data')
    return [...FEATURED_PRODUCTS, ...NEW_ARRIVALS, ...SALE_PRODUCTS]
      .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
      .map((p) => ({ slug: p.slug }))
  }
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('slug')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)
    return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getMockBySlug(slug: string): Promise<Product | null> {
  const { FEATURED_PRODUCTS, NEW_ARRIVALS, SALE_PRODUCTS } = await import('@/lib/mock-data')
  const all = [...FEATURED_PRODUCTS, ...NEW_ARRIVALS, ...SALE_PRODUCTS].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
  )
  return all.find((p) => p.slug === slug) ?? null
}

async function attachVariants(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  products: Product[],
): Promise<Product[]> {
  if (!products.length) return []
  const ids = products.map((p) => p.id)
  const { data: variantRows } = await supabase
    .from('product_variants')
    .select('*')
    .in('product_id', ids)
  const byProduct = new Map<string, Product['variants']>()
  ;(variantRows ?? []).forEach((v: { product_id: string }) => {
    if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, [])
    byProduct.get(v.product_id)!.push(v as never)
  })
  return products.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }))
}

async function attachColorImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  products: Product[],
): Promise<Product[]> {
  if (!products.length) return products
  const ids = products.map((p) => p.id)
  const { data: rows } = await supabase
    .from('product_color_images')
    .select('*')
    .in('product_id', ids)
  const byProduct = new Map<string, ProductColorImages[]>()
  ;(rows ?? []).forEach((ci: ProductColorImages) => {
    if (!byProduct.has(ci.product_id)) byProduct.set(ci.product_id, [])
    byProduct.get(ci.product_id)!.push(ci)
  })
  return products.map((p) => ({ ...p, color_images: byProduct.get(p.id) ?? [] }))
}

async function fetchProduct(slug: string): Promise<Product | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return getMockBySlug(slug)
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error || !data) return null
    const [withVariants] = await attachVariants(supabase, [data as Product])
    if (!withVariants) return null
    const [withColorImages] = await attachColorImages(supabase, [withVariants])
    return withColorImages ?? null
  } catch {
    return getMockBySlug(slug)
  }
}

async function fetchSizeGuide(type: string): Promise<SizeGuideData | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('size_guides')
      .select('headers, rows')
      .eq('type', type)
      .single()
    if (!data) return null
    return {
      headers: (data.headers as string[]) ?? [],
      rows: (data.rows as string[][]) ?? [],
    }
  } catch {
    return null
  }
}

async function fetchRelated(product: Product): Promise<{ look: Product[]; similar: Product[] }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { FEATURED_PRODUCTS, NEW_ARRIVALS, SALE_PRODUCTS } = await import('@/lib/mock-data')
    const all = [...FEATURED_PRODUCTS, ...NEW_ARRIVALS, ...SALE_PRODUCTS]
      .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
      .filter((p) => p.id !== product.id)
    return {
      look: all.filter((p) => p.gender === product.gender && p.type === product.type).slice(0, 4),
      similar: all.filter((p) => product.tags.some((t) => p.tags.includes(t))).slice(0, 4),
    }
  }
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createAdminClient()

    const { data: lookRaw } = await supabase
      .from('products')
      .select('*')
      .eq('type', product.type)
      .eq('gender', product.gender)
      .eq('is_active', true)
      .neq('id', product.id)
      .limit(4)

    let similarRaw: Product[] = []
    if (product.tags.length > 0) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .neq('id', product.id)
        .overlaps('tags', product.tags)
        .limit(4)
      similarRaw = (data ?? []) as Product[]
    }

    const look = await attachVariants(supabase, (lookRaw ?? []) as Product[])
    const similar = await attachVariants(supabase, similarRaw)
    return { look, similar }
  } catch {
    return { look: [], similar: [] }
  }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: 'Producto no encontrado | Savaya' }

  const description = product.description
    ? product.description.slice(0, 160)
    : `Compra ${product.name} en Savaya. Envío rápido a todo Colombia.`

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

  return {
    title: product.name,
    description,
    alternates: { canonical: `${APP_URL}/${slug}` },
    robots: { index: false, follow: true },
    openGraph: {
      title: `${product.name} | Savaya`,
      description,
      url: `${APP_URL}/${slug}`,
      images: product.images[0]
        ? [{ url: product.images[0], width: 1200, height: 1200, alt: product.name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Savaya`,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) notFound()

  const [{ look, similar }, sizeGuide] = await Promise.all([
    fetchRelated(product),
    fetchSizeGuide(product.type),
  ])

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

  const GENDER_LABELS: Record<string, string> = {
    women: 'Mujer', men: 'Hombre', kids: 'Niños', unisex: 'Unisex',
  }
  const GENDER_SLUGS: Record<string, string> = {
    // SAVAYA: solo calzado femenino
    women: 'casuales', men: 'casuales', kids: 'casuales', unisex: 'casuales',
  }

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? '',
    image: product.images,
    url: `${APP_URL}/producto/${slug}`,
    brand: { '@type': 'Brand', name: 'Savaya' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'COP',
      price: product.sale_price ?? product.base_price,
      availability: `https://schema.org/${
        !product.variants?.length || product.variants.some((v) => v.stock > 0)
          ? 'InStock'
          : 'OutOfStock'
      }`,
      url: `${APP_URL}/producto/${slug}`,
      seller: { '@type': 'Organization', name: 'Savaya' },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: GENDER_LABELS[product.gender] ?? 'Catálogo',
        item: `${APP_URL}/${GENDER_SLUGS[product.gender] ?? 'mujer'}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${APP_URL}/producto/${slug}`,
      },
    ],
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-8 md:pt-6 md:pb-14">
        {/* ── Main PDP: gallery + info ── */}
        <ProductPageClient product={product} sizeGuide={sizeGuide} />

        {/* ── Completa el look ── */}
        {look.length > 0 && (
          <section className="mt-20 md:mt-28">
            <h2 className="font-display text-2xl font-bold mb-8">Completa el look</h2>
            <ProductGrid products={look} />
          </section>
        )}

        {/* ── También te puede gustar ── */}
        {similar.length > 0 && (
          <section className="mt-14 md:mt-20">
            <h2 className="font-display text-2xl font-bold mb-8">También te puede gustar</h2>
            <ProductGrid products={similar} />
          </section>
        )}
      </div>
    </main>
  )
}
