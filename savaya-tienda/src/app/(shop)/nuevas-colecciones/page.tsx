import type { Metadata } from 'next'
import { parseSearchParams, fetchCatalogProducts, getSizesFromProducts, getColorsFromProducts } from '@/lib/catalog'
import CategoryHero from '@/components/catalog/CategoryHero'
import CatalogSection from '@/components/catalog/CatalogSection'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Nuevas Colecciones — Últimas Tendencias',
  description: 'Descubre los últimos modelos de calzado femenino. Las nuevas colecciones de Savaya recién llegadas con envío rápido a Venezuela.',
  openGraph: {
    title: 'Nuevas Colecciones — Últimas Tendencias | Savaya',
    description: 'Lo más nuevo en calzado femenino. Modelos recién llegados de Savaya.',
    url: `${APP_URL}/nuevas-colecciones`,
    images: [{ url: `${APP_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Nuevas colecciones — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nuevas Colecciones | Savaya',
    description: 'Lo más nuevo en moda para toda la familia con envío rápido a toda Venezuela.',
    images: [`${APP_URL}/og-default.jpg`],
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'Nuevas Colecciones', item: `${APP_URL}/nuevas-colecciones` },
  ],
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NuevasColeccionesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = parseSearchParams(params, 'newest')
  const { products, total } = await fetchCatalogProducts({ fixedIsNew: true }, filters)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryHero
        title="Nuevas Colecciones"
        description="Lo último en moda, recién llegado"
        productCount={total}
      />
      <CatalogSection
        products={products}
        total={total}
        availableSizes={getSizesFromProducts(products)}
        availableColors={getColorsFromProducts(products)}
      />
    </main>
  )
}
