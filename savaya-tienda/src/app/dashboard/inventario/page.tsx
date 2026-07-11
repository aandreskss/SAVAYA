import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import InventoryTable, { type InventoryRow } from '@/components/dashboard/inventario/InventoryTable'

export const metadata: Metadata = { title: 'Inventario — Admin' }

export default async function InventarioPage() {
  const supabase = await createAdminClient()

  const { data: rawVariants } = await supabase
    .from('product_variants')
    .select(`
      id,
      product_id,
      sku,
      size,
      color,
      color_hex,
      stock,
      product:products (
        id,
        name,
        images,
        gender,
        type,
        is_active,
        category:categories ( name ),
        brand:brands ( name )
      )
    `)
    .order('product_id')
    .order('sku')
    .order('size')

  type RawVariant = {
    id: string
    product_id: string
    sku: string | null
    size: string | null
    color: string | null
    color_hex: string | null
    stock: number
    product: {
      id: string
      name: string
      images: string[]
      gender: string
      type: string
      is_active: boolean
      category: { name: string } | null
      brand: { name: string } | null
    } | null
  }

  const rows: InventoryRow[] = ((rawVariants ?? []) as unknown as RawVariant[])
    .filter(v => v.product !== null)
    .map(v => ({
      id: v.id,
      product_id: v.product_id,
      sku: v.sku ?? '',
      size: v.size ?? '',
      color: v.color ?? '',
      color_hex: v.color_hex ?? '',
      stock: v.stock ?? 0,
      product_name: v.product!.name,
      product_image: v.product!.images?.[0] ?? null,
      product_gender: v.product!.gender,
      product_type: v.product!.type,
      product_is_active: v.product!.is_active,
      category_name: v.product!.category?.name ?? null,
      brand_name: v.product!.brand?.name ?? null,
    }))

  const outOfStock = rows.filter(r => r.stock === 0).length
  const lowStock = rows.filter(r => r.stock > 0 && r.stock <= 5).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-black">Inventario</h1>
          <p className="text-sm text-gray-text font-body mt-0.5">
            {rows.length} variante{rows.length !== 1 ? 's' : ''} en total
            {outOfStock > 0 && (
              <span className="ml-2 text-sale font-semibold">· {outOfStock} sin stock</span>
            )}
            {lowStock > 0 && (
              <span className="ml-2 text-yellow-600 font-semibold">· {lowStock} con stock bajo</span>
            )}
          </p>
        </div>
      </div>

      <InventoryTable rows={rows} />
    </div>
  )
}
