import type { Metadata } from 'next'
import { parseSearchParams, fetchCatalogProducts, getDisabledCategories, getSizesFromProducts, getColorsFromProducts } from '@/lib/catalog'
import CategoryHero from '@/components/catalog/CategoryHero'
import CatalogSection from '@/components/catalog/CatalogSection'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Accesorios de Moda — Bolsos, Joyería y Más',
  description: 'Accesorios de moda femenina con envío rápido a toda Venezuela. Paga con Zelle, Binance o USDT.',
  openGraph: {
    title: 'Accesorios de Moda — Bolsos, Joyería y Más | Savaya',
    description: 'Bolsos, joyería, gorras, cinturones y más para completar tu look con envío rápido.',
    url: `${APP_URL}/accesorios`,
    images: [{ url: `${APP_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Accesorios — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accesorios de Moda | Savaya',
    description: 'Bolsos, joyería, gorras y más para completar tu look con envío rápido.',
    images: [`${APP_URL}/og-default.jpg`],
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
    { '@type': 'ListItem', position: 2, name: 'Accesorios', item: `${APP_URL}/accesorios` },
  ],
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AccesoriosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [filters, disabledCategories] = await Promise.all([
    Promise.resolve(parseSearchParams(params)),
    getDisabledCategories(),
  ])
  const { products, total } = await fetchCatalogProducts({ fixedType: ['accessories'] }, filters)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryHero
        title="Accesorios"
        description="Bolsos, joyería, gorras y más para completar tu look"
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
