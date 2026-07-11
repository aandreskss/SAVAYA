import type { Metadata } from 'next'
import { parseSearchParams, fetchCatalogProducts, getDisabledCategories, getSizesFromProducts, getColorsFromProducts } from '@/lib/catalog'
import CategoryHero from '@/components/catalog/CategoryHero'
import CatalogSection from '@/components/catalog/CatalogSection'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Los Más Vendidos — Ropa, Zapatos y Accesorios',
  description: 'Los zapatos más vendidos de Savaya. Casuales, deportivos y de vestir — los favoritos de nuestras clientas con envío a toda Venezuela.',
  alternates: { canonical: `${APP_URL}/mas-vendidos` },
  openGraph: {
    title: 'Los Más Vendidos | Savaya',
    description: 'Descubre los productos más vendidos en moda para toda la familia con envío rápido.',
    url: `${APP_URL}/mas-vendidos`,
    images: [{ url: `${APP_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Los más vendidos — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Los Más Vendidos | Savaya',
    description: 'Los productos más vendidos en moda para toda la familia.',
    images: [`${APP_URL}/og-default.jpg`],
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'Más Vendidos', item: `${APP_URL}/mas-vendidos` },
  ],
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MasVendidosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [filters, disabledCategories] = await Promise.all([
    Promise.resolve(parseSearchParams(params)),
    getDisabledCategories(),
  ])
  const { products, total } = await fetchCatalogProducts({ fixedIsFeatured: true }, filters)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryHero
        title="Los más vendidos"
        description="Ropa, zapatos y accesorios favoritos de nuestros clientes"
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
