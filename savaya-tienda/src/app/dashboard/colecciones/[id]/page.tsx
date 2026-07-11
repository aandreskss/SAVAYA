import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import CollectionEditor from '@/components/dashboard/colecciones/CollectionEditor'
import { getCollectionWithProducts } from '../actions'
import type { Product } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditarColeccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [colData, productsData] = await Promise.all([
    getCollectionWithProducts(id),
    createAdminClient()
      .from('products')
      .select('id, name, slug, images, base_price, sale_price')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  if (!colData) notFound()

  const allProducts = (productsData.data ?? []) as Pick<
    Product, 'id' | 'name' | 'slug' | 'images' | 'base_price' | 'sale_price'
  >[]

  const col = colData.collection as {
    id: string; name: string; slug: string; description: string | null
    is_active: boolean; show_on_home: boolean; nav_gender: string | null
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/dashboard/colecciones" className="text-sm text-gray-text hover:text-black font-body">
          ← Colecciones
        </Link>
      </div>
      <h1 className="font-heading font-bold text-2xl text-black mb-6">Editar colección</h1>
      <CollectionEditor
        allProducts={allProducts}
        initial={{
          id: col.id,
          name: col.name,
          slug: col.slug,
          description: col.description,
          is_active: col.is_active,
          show_on_home: col.show_on_home,
          nav_gender: col.nav_gender,
          products: colData.products,
        }}
      />
    </div>
  )
}
