import Link from 'next/link'
import { listAdminCategories } from '@/domains/admin/catalog/repository'
import { CategoriesTable } from '@/domains/admin/catalog/components/CategoriesTable'

export default async function CategoriasPage() {
  const rows = await listAdminCategories()

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-3xl uppercase tracking-wide mb-2">Categorías</h1>

      {/* Sub-nav */}
      <div className="flex gap-6 mb-8 border-b border-border">
        <Link
          href="/admin/productos"
          className="pb-2.5 font-sans text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Todos los productos
        </Link>
        <Link
          href="/admin/productos/categorias"
          className="pb-2.5 font-sans text-sm font-medium border-b-2 border-accent-gold text-accent-gold"
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

      <CategoriesTable rows={rows} />
    </div>
  )
}
