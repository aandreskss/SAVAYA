import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { parseSearchParams, fetchCatalogProducts, getDisabledCategories, getSizesFromProducts, getColorsFromProducts } from '@/lib/catalog'
import CategoryHero from '@/components/catalog/CategoryHero'
import CatalogSection from '@/components/catalog/CatalogSection'
import type { Brand } from '@/lib/types'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('brands')
    .select('name, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!data) return { title: 'Marca no encontrada' }

  const brand = data as { name: string; slug: string }
  const description = `Explora el calzado femenino de ${brand.name} disponible en Savaya Venezuela. Envíos rápidos a todo el país.`
  return {
    title: `${brand.name} | Savaya`,
    description,
    alternates: { canonical: `${APP_URL}/marcas/${brand.slug}` },
    openGraph: {
      title: `${brand.name} — Moda en Savaya`,
      description,
      url: `${APP_URL}/marcas/${brand.slug}`,
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: `${brand.name} — Savaya` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand.name} | Savaya`,
    },
  }
}

export default async function MarcaPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const supabase = await createAdminClient()

  const { data: brandData } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!brandData) notFound()

  const brand = brandData as Brand

  const resolvedParams = await searchParams
  const [filters, disabledCategories] = await Promise.all([
    Promise.resolve(parseSearchParams(resolvedParams)),
    getDisabledCategories(),
  ])

  const { products, total } = await fetchCatalogProducts(
    { fixedBrandSlug: slug },
    filters,
  )

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Marcas', item: `${APP_URL}/marcas` },
      { '@type': 'ListItem', position: 3, name: brand.name, item: `${APP_URL}/marcas/${brand.slug}` },
    ],
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryHero
        title={brand.name}
        description={`Toda la colección de ${brand.name}`}
        imageUrl={brand.logo_url ?? undefined}
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
