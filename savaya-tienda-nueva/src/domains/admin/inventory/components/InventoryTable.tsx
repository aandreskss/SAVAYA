'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/shared/ui/Badge'
import { MovementModal } from './MovementModal'
import { InventoryImportModal } from './InventoryImportModal'
import type { InventoryRow } from '../types'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 1v8M4.5 4.5l3-3 3 3M2 11h11v3H2v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

type Props = {
  rows: InventoryRow[]
  search: string
}

export function InventoryTable({ rows, search }: Props) {
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localSearch, setLocalSearch] = useState(search)
  const [movementTarget, setMovementTarget] = useState<InventoryRow | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showLowOnly, setShowLowOnly] = useState(false)

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (showLowOnly) setShowLowOnly(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const sp = new URLSearchParams()
      if (value) sp.set('search', value)
      router.push(`/admin/inventario?${sp.toString()}`)
    }, 350)
  }

  const lowCount = rows.filter((r) => r.isLow).length
  const displayRows = showLowOnly ? rows.filter((r) => r.isLow) : rows

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por producto, SKU, color o talla..."
            className="h-11 w-full pl-10 pr-4 rounded-sm border border-border bg-surface font-sans text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
          />
        </div>

        {/* Low stock filter toggle */}
        {lowCount > 0 && (
          <button
            type="button"
            onClick={() => setShowLowOnly((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-sans shrink-0 transition-colors ${
              showLowOnly
                ? 'bg-warning/15 border-warning/50 text-warning font-medium'
                : 'bg-warning/5 border-warning/30 text-warning hover:bg-warning/10'
            }`}
          >
            <WarningIcon />
            {lowCount} con stock bajo
            {showLowOnly && (
              <span className="ml-1 text-xs opacity-70">· filtrado</span>
            )}
          </button>
        )}

        {/* Import CSV button */}
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-accent-gold/50 hover:text-accent-gold text-text-secondary text-sm font-sans shrink-0 transition-colors"
        >
          <UploadIcon />
          Importar CSV
        </button>
      </div>

      {/* Active filter banner */}
      {showLowOnly && (
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 bg-warning/8 border border-warning/25 rounded-lg">
          <span className="text-sm text-warning font-medium">
            Mostrando {displayRows.length} variante{displayRows.length !== 1 ? 's' : ''} con stock bajo o agotado
          </span>
          <button
            type="button"
            onClick={() => setShowLowOnly(false)}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Mostrar todas ×
          </button>
        </div>
      )}

      {/* Table */}
      {displayRows.length === 0 ? (
        <div className="border border-border rounded-xl p-12 text-center bg-surface">
          <p className="font-sans text-sm text-text-secondary">
            {search
              ? `Sin resultados para "${search}"`
              : showLowOnly
                ? 'No hay variantes con stock bajo actualmente.'
                : 'Sin variantes activas en inventario.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm" role="grid">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Producto</th>
                  <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">SKU</th>
                  <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Color / Talla</th>
                  <th scope="col" className="px-4 py-3 text-right font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-4 py-3 text-right font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Reservado</th>
                  <th scope="col" className="px-4 py-3 text-right font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Disponible</th>
                  <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayRows.map((row) => (
                  <tr
                    key={row.variantId}
                    className={`transition-colors ${row.isLow ? 'bg-warning/5 hover:bg-warning/10' : 'hover:bg-surface-2/50'}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-sans text-sm font-medium text-text-primary">
                        {row.productName}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-sans text-xs font-mono text-text-secondary">
                        {row.sku}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: row.colorHex }}
                          title={row.colorName}
                        />
                        <span className="font-sans text-sm text-text-primary">
                          {row.colorName} · T{row.sizeName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className={`font-sans text-sm font-medium ${row.quantity === 0 ? 'text-error' : 'text-text-primary'}`}>
                        {row.quantity}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-sans text-sm text-text-secondary">
                        {row.reserved}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className={`font-sans text-sm font-medium ${row.available === 0 ? 'text-error' : row.isLow ? 'text-warning' : 'text-text-primary'}`}>
                        {row.available}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {row.available === 0 ? (
                        <Badge variant="error" size="sm">Sin stock</Badge>
                      ) : row.isLow ? (
                        <Badge variant="warning" size="sm">Stock bajo</Badge>
                      ) : (
                        <Badge variant="success" size="sm">OK</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setMovementTarget(row)}
                          className="px-2.5 py-1 rounded text-xs font-sans border border-accent-gold/50 hover:bg-accent-gold/10 text-accent-gold transition-colors"
                        >
                          Ajustar
                        </button>
                        <Link href={`/admin/inventario/${row.variantId}`}>
                          <button className="px-2.5 py-1 rounded text-xs font-sans border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors">
                            Historial
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {movementTarget && (
        <MovementModal
          row={movementTarget}
          isOpen={!!movementTarget}
          onClose={() => setMovementTarget(null)}
        />
      )}

      <InventoryImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
      />
    </div>
  )
}
