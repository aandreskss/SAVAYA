import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { Brand } from '@/lib/types'
import BrandsListClient from './BrandsListClient'

export const metadata: Metadata = { title: 'Marcas — Admin' }

export default async function MarcasPage() {
  const supabase = await createAdminClient()

  const [{ data: brands }, { data: productCounts }] = await Promise.all([
    supabase.from('brands').select('*').order('order').order('name'),
    supabase
      .from('products')
      .select('brand_id')
      .not('brand_id', 'is', null),
  ])

  const countByBrand = new Map<string, number>()
  for (const p of productCounts ?? []) {
    if (p.brand_id) {
      countByBrand.set(p.brand_id, (countByBrand.get(p.brand_id) ?? 0) + 1)
    }
  }

  const brandsWithCount = ((brands ?? []) as Brand[]).map((b) => ({
    ...b,
    productCount: countByBrand.get(b.id) ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-black">Marcas</h1>
          <p className="text-sm text-gray-text font-body mt-0.5">
            {brandsWithCount.length} marca{brandsWithCount.length !== 1 ? 's' : ''} registrada{brandsWithCount.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/marcas/nueva"
          className="bg-black text-white font-heading font-semibold text-sm px-4 py-2.5 rounded hover:bg-accent transition-colors"
        >
          + Nueva marca
        </Link>
      </div>

      <BrandsListClient brands={brandsWithCount} />
    </div>
  )
}
