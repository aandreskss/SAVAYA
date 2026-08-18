import { notFound } from 'next/navigation'
import { getProductBySlug, getRelatedProducts } from '@/domains/catalog/repository'
import { getCurrentRate } from '@/domains/exchange-rates/service'
import { ProductClientShell } from '@/domains/catalog/components/ProductClientShell'
import { RecentlyViewed } from '@/domains/catalog/components/RecentlyViewed'
import { RecentlyViewedTracker } from '@/domains/catalog/components/RecentlyViewedTracker'
import { ProductCard, Breadcrumb } from '@/shared/ui'
import { addToCart } from '@/domains/cart/actions'
import { getWishlistIds } from '@/domains/customers/wishlist-actions'
import type { Metadata } from 'next'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ slug: string }> }

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'

// ISR: revalidate every 5 minutes — stock and prices can change
export const revalidate = 300

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  return {
    title: product.seoTitle ?? `${product.name} — SAVAYA`,
    description:
      product.seoDescription ??
      `Compra ${product.name} en SAVAYA. Calzado venezolano de calidad.`,
    alternates: {
      canonical: `${BASE_URL}/producto/${slug}`,
    },
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  }
}

// ---------------------------------------------------------------------------
// ProductPage — Server Component
// ---------------------------------------------------------------------------

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  // Fetch product, exchange rate, and wishlist IDs in parallel
  const [product, exchangeRate, wishlistVariantIds] = await Promise.all([
    getProductBySlug(slug),
    getCurrentRate(),
    getWishlistIds(),
  ])

  if (!product) notFound()

  const relatedProducts = await getRelatedProducts(product.id, product.category?.id ?? '')

  // ── Structured data ────────────────────────────────────────────────────────

  const firstVariant = product.variants[0]
  const inStock = product.variants.some((v) => v.isAvailable)
  const productUrl = `${BASE_URL}/producto/${product.slug}`

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((img) => img.url),
    sku: firstVariant?.sku ?? undefined,
    brand: { '@type': 'Brand', name: 'SAVAYA' },
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.basePrice.toFixed(2),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: { '@type': 'Organization', name: 'SAVAYA' },
    },
  }

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
    ...(product.category
      ? [
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category.name,
            item: `${BASE_URL}/categoria/${product.category.slug}`,
          },
          { '@type': 'ListItem', position: 3, name: product.name },
        ]
      : [{ '@type': 'ListItem', position: 2, name: product.name }]),
  ]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Track visit in localStorage (client only, no UI) */}
      <RecentlyViewedTracker productId={product.id} />

      <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            ...(product.category
              ? [{ label: product.category.name, href: `/categoria/${product.category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        {/* Main PDP layout — client shell manages selectedVariantId */}
        <ProductClientShell
          product={product}
          exchangeRate={exchangeRate}
          onAddToCart={addToCart}
          wishlistVariantIds={wishlistVariantIds}
        />

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20" aria-labelledby="related-products-heading">
            <h2
              id="related-products-heading"
              className="font-display text-2xl font-bold mb-6 text-text-primary"
            >
              También te puede gustar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  basePrice={p.basePrice}
                  compareAtPrice={p.compareAtPrice}
                  images={p.images}
                  availableColors={p.availableColors}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed — client-only, reads localStorage */}
        <RecentlyViewed currentProductId={product.id} />
      </div>
    </>
  )
}
