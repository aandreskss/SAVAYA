import Link from 'next/link'
import { listAdminProducts } from '@/domains/admin/catalog/repository'
import { ProductsTable } from '@/domains/admin/catalog/components/ProductsTable'

export default async function ProductosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 20

  const { rows, total } = await listAdminProducts({
    search,
    status: status as 'all' | 'published' | 'draft' | 'archived' | undefined,
    page,
    limit,
  })

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-3xl uppercase tracking-wide mb-2">Productos</h1>

      {/* Sub-nav */}
      <div className="flex gap-6 mb-8 border-b border-border">
        <Link
          href="/admin/productos"
          className="pb-2.5 font-sans text-sm font-medium border-b-2 border-accent-gold text-accent-gold"
        >
          Todos los productos
        </Link>
        <Link
          href="/admin/productos/categorias"
          className="pb-2.5 font-sans text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Categorías
        </Link>
        <Link
          href="/admin/productos/colecciones"
          className="pb-2.5 font-sans text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Colecciones
        </Link>
      </div>

      <p className="text-text-secondary text-sm mb-6">
        {total} producto{total !== 1 ? 's' : ''} en total
      </p>

      <ProductsTable
        rows={rows}
        total={total}
        page={page}
        limit={limit}
        search={search}
        status={status}
      />
    </div>
  )
}
