import type { Metadata } from 'next'
import { parseSearchParams, fetchCatalogProducts, getDisabledCategories, getSizesFromProducts, getColorsFromProducts } from '@/lib/catalog'
import CategoryHero from '@/components/catalog/CategoryHero'
import CatalogSection from '@/components/catalog/CatalogSection'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Ofertas y Descuentos en Moda',
  description: 'Zapatos femeninos con descuento. Casuales, deportivos y de vestir en oferta con envío rápido a toda Venezuela.',
  openGraph: {
    title: 'Ofertas y Descuentos en Moda | Savaya',
    description: 'Las mejores ofertas en moda. Ropa, zapatos y accesorios a precios increíbles.',
    url: `${APP_URL}/descuentos`,
    images: [{ url: `${APP_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Descuentos en moda — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ofertas y Descuentos en Moda | Savaya',
    description: 'Las mejores ofertas en moda para toda la familia con envío rápido.',
    images: [`${APP_URL}/og-default.jpg`],
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'Descuentos', item: `${APP_URL}/descuentos` },
  ],
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DescuentosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [filters, disabledCategories] = await Promise.all([
    Promise.resolve(parseSearchParams(params)),
    getDisabledCategories(),
  ])
  const { products, total } = await fetchCatalogProducts({ fixedOnSale: true }, filters)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryHero
        title="Descuentos"
        description="Las mejores ofertas de moda para ti"
        productCount={total}
      />
      <CatalogSection
        products={products}
        total={total}
        availableSizes={getSizesFromProducts(products)}
        availableColors={getColorsFromProducts(products)}
        showGenderFilter
        disabledCategories={disabledCategories}
      />
    </main>
  )
}
