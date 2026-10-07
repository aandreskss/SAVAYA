import { notFound, redirect } from 'next/navigation'
import { getProductBySlug, getRelatedProducts } from '@/domains/catalog/repository'
import { getDisplayRate } from '@/domains/exchange-rates/service'
import { ProductClientShell } from './ProductClientShell'
import { RecentlyViewed } from './RecentlyViewed'
import { RecentlyViewedTracker } from './RecentlyViewedTracker'
import { ProductCard, Breadcrumb } from '@/shared/ui'
import { addToCart } from '@/domains/cart/actions'
import { getWishlistIds } from '@/domains/customers/wishlist-actions'
import { productHref } from '@/shared/lib/product-href'

type Props = {
  slug: string
  // 'unisex' for /producto/[slug], gender slug for /mujer/producto/, /hombre/producto/, etc.
  genderContext: string
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'

export async function GenericProductPage({ slug, genderContext }: Props) {
  const [product, exchangeRate, wishlistVariantIds] = await Promise.all([
    getProductBySlug(slug),
    getDisplayRate(),
    getWishlistIds(),
  ])

  if (!product) notFound()

  // Redirect to the canonical gender URL if the path doesn't match
  const canonicalPath = productHref(product.gender, product.slug)
  const currentPath =
    genderContext === 'unisex' ? `/producto/${slug}` : `/${genderContext}/producto/${slug}`
  if (canonicalPath !== currentPath) {
    redirect(canonicalPath)
  }

  const relatedProducts = await getRelatedProducts(product.id, product.category?.id ?? '')

  const firstVariant = product.variants[0]
  const inStock = product.variants.some((v) => v.isAvailable)
  const productUrl = `${BASE_URL}${canonicalPath}`

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
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: { '@type': 'Organization', name: 'SAVAYA' },
    },
  }

  const genderLabel =
    genderContext === 'mujer'
      ? 'Mujer'
      : genderContext === 'hombre'
        ? 'Hombre'
        : genderContext !== 'unisex'
          ? genderContext.charAt(0).toUpperCase() + genderContext.slice(1)
          : null

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
    ...(genderLabel
      ? [
          {
            '@type': 'ListItem',
            position: 2,
            name: genderLabel,
            item: `${BASE_URL}/${genderContext}`,
          },
        ]
      : []),
    ...(product.category
      ? [
          {
            '@type': 'ListItem',
            position: genderLabel ? 3 : 2,
            name: product.category.name,
            item: `${BASE_URL}${genderLabel ? `/${genderContext}` : ''}/categoria/${product.category.slug}`,
          },
          { '@type': 'ListItem', position: genderLabel ? 4 : 3, name: product.name },
        ]
      : [{ '@type': 'ListItem', position: genderLabel ? 3 : 2, name: product.name }]),
  ]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  const breadcrumbUi = [
    { label: 'Inicio', href: '/' },
    ...(genderLabel ? [{ label: genderLabel, href: `/${genderContext}` }] : []),
    ...(product.category
      ? [
          {
            label: product.category.name,
            href: `${genderLabel ? `/${genderContext}` : ''}/categoria/${product.category.slug}`,
          },
        ]
      : []),
    { label: product.name },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <RecentlyViewedTracker productId={product.id} />

      <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-8">
        <Breadcrumb items={breadcrumbUi} />

        <ProductClientShell
          product={product}
          exchangeRate={exchangeRate}
          onAddToCart={addToCart}
          wishlistVariantIds={wishlistVariantIds}
        />

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
                  gender={p.gender}
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

        <RecentlyViewed currentProductId={product.id} />
      </div>
    </>
  )
}
