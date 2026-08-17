import { listInventory } from '@/domains/admin/inventory/repository'
import { InventoryTable } from '@/domains/admin/inventory/components/InventoryTable'

type SearchParams = Promise<{ search?: string }>

export default async function InventarioAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { search = '' } = await searchParams
  const rows = await listInventory(search || undefined)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Inventario</h1>
        <p className="font-sans text-sm text-text-secondary">
          {rows.length} variante{rows.length !== 1 ? 's' : ''} activa{rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      <InventoryTable rows={rows} search={search} />
    </div>
  )
}
