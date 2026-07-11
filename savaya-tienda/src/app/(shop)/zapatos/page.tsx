import type { Metadata } from 'next'
import { parseSearchParams, fetchCatalogProducts, getDisabledCategories, getSizesFromProducts, getColorsFromProducts } from '@/lib/catalog'
import CategoryHero from '@/components/catalog/CategoryHero'
import CatalogSection from '@/components/catalog/CatalogSection'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Zapatos de Moda — Mujer, Hombre y Niños',
  description: 'Casuales, deportivos y de vestir. La mejor selección de calzado femenino de Savaya con envío rápido a toda Venezuela.',
  openGraph: {
    title: 'Zapatos de Moda — Mujer, Hombre y Niños | Savaya',
    description: 'Tenis, sandalias, botas y más. La mejor selección de zapatos con envío rápido.',
    url: `${APP_URL}/zapatos`,
    images: [{ url: `${APP_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Zapatos — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zapatos de Moda | Savaya',
    description: 'Tenis, sandalias, botas y más para toda la familia con envío rápido.',
    images: [`${APP_URL}/og-default.jpg`],
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'Zapatos', item: `${APP_URL}/zapatos` },
  ],
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ZapatosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [filters, disabledCategories] = await Promise.all([
    Promise.resolve(parseSearchParams(params)),
    getDisabledCategories(),
  ])
  const { products, total } = await fetchCatalogProducts({ fixedType: ['shoes'] }, filters)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryHero
        title="Zapatos"
        description="Tenis, sandalias, botas y más para toda la familia"
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
