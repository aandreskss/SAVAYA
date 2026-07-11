import type { Metadata } from 'next'
import { parseSearchParams, fetchCatalogProducts, getSizesFromProducts, getColorsFromProducts } from '@/lib/catalog'
import CategoryHero from '@/components/catalog/CategoryHero'
import CatalogSection from '@/components/catalog/CatalogSection'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Ropa y Moda para Mujer',
  description: 'Descubre la última tendencia en moda femenina. Ropa, zapatos y accesorios para mujer con envío rápido a toda Venezuela.',
  openGraph: {
    title: 'Ropa y Moda para Mujer | Savaya',
    description: 'Descubre la última tendencia en moda femenina. Ropa, zapatos y accesorios con envío rápido.',
    url: `${APP_URL}/mujer`,
    images: [{ url: `${APP_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Moda mujer — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ropa y Moda para Mujer | Savaya',
    description: 'La última tendencia en moda femenina con envío rápido a toda Venezuela.',
    images: [`${APP_URL}/og-default.jpg`],
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'Mujer', item: `${APP_URL}/mujer` },
  ],
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MujerPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = parseSearchParams(params)
  const { products, total } = await fetchCatalogProducts({ fixedGender: ['women'] }, filters)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryHero
        title="Mujer"
        description="Última tendencia en moda femenina"
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
