import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import CollectionEditor from '@/components/dashboard/colecciones/CollectionEditor'
import type { Product } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NuevaColeccionPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, images, base_price, sale_price')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const allProducts = (data ?? []) as Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'base_price' | 'sale_price'>[]

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/dashboard/colecciones" className="text-sm text-gray-text hover:text-black font-body">
          ← Colecciones
        </Link>
      </div>
      <h1 className="font-heading font-bold text-2xl text-black mb-6">Nueva colección</h1>
      <CollectionEditor allProducts={allProducts} />
    </div>
  )
}
