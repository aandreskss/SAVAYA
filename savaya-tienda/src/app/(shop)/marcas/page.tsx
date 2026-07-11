import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { Brand } from '@/lib/types'

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Marcas de Moda | Savaya',
  description: 'Explora todas las marcas de calzado disponibles en Savaya Venezuela. Paga con Zelle, Binance o USDT.',
  alternates: { canonical: `${APP_URL}/marcas` },
  openGraph: {
    title: 'Marcas de Moda | Savaya',
    description: 'Todas las marcas disponibles en Savaya Venezuela.',
    url: `${APP_URL}/marcas`,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Marcas de Moda — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marcas de Moda | Savaya',
  },
}

export default async function MarcasPage() {
  const supabase = await createAdminClient()

  const [{ data: brands }, { data: productCounts }] = await Promise.all([
    supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('products')
      .select('brand_id')
      .eq('is_active', true)
      .not('brand_id', 'is', null),
  ])

  const countByBrand = new Map<string, number>()
  for (const p of productCounts ?? []) {
    if (p.brand_id) {
      countByBrand.set(p.brand_id, (countByBrand.get(p.brand_id) ?? 0) + 1)
    }
  }

  const activeBrands = ((brands ?? []) as Brand[]).filter(
    (b) => (countByBrand.get(b.id) ?? 0) > 0
  )

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black mb-2">
          Marcas
        </h1>
        <p className="text-gray-text font-body text-sm">
          {activeBrands.length} marca{activeBrands.length !== 1 ? 's' : ''} disponible{activeBrands.length !== 1 ? 's' : ''}
        </p>
      </div>

      {activeBrands.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-text font-body text-sm">No hay marcas disponibles todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {activeBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/marcas/${brand.slug}`}
              className="group flex flex-col items-center gap-3 p-6 border border-gray-light rounded bg-white hover:border-black hover:shadow-md transition-all duration-200"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                {brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-bg flex items-center justify-center">
                    <span className="text-xl font-display font-bold text-gray-text">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="font-heading font-semibold text-sm text-black group-hover:text-accent transition-colors">
                  {brand.name}
                </p>
                <p className="text-[11px] text-gray-text font-body mt-0.5">
                  {countByBrand.get(brand.id) ?? 0} producto{(countByBrand.get(brand.id) ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
