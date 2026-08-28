import Link from 'next/link'
import { ImportProductsForm } from '@/domains/admin/catalog/components/ImportProductsForm'

export const dynamic = 'force-dynamic'

export default function ImportarProductosPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-text-secondary">
        <Link href="/admin/productos" className="flex items-center gap-1 hover:text-text-primary transition-colors">
          ← Productos
        </Link>
        <span>/</span>
        <span className="text-text-primary">Importar CSV</span>
      </div>

      <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Importar productos</h1>
      <p className="text-text-secondary text-sm mb-8">
        Carga múltiples productos y variantes desde un archivo CSV. Los productos se crean en borrador — completa imágenes y publica desde el editor.
      </p>

      <ImportProductsForm />
    </div>
  )
}
