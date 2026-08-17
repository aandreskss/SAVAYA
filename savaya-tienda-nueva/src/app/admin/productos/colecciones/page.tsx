import Link from 'next/link'
import { listAdminCollections } from '@/domains/admin/catalog/repository'
import { CollectionsTable } from '@/domains/admin/catalog/components/CollectionsTable'

export default async function ColeccionesPage() {
  const rows = await listAdminCollections()

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-3xl uppercase tracking-wide mb-2">Colecciones</h1>

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
          className="pb-2.5 font-sans text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Categorías
        </Link>
        <Link
          href="/admin/productos/colecciones"
          className="pb-2.5 font-sans text-sm font-medium border-b-2 border-accent-gold text-accent-gold"
        >
          Colecciones
        </Link>
      </div>

      <CollectionsTable rows={rows} />
    </div>
  )
}
