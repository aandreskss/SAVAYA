'use client'

import { useState } from 'react'
import { Badge } from '@/shared/ui/Badge'
import { MovementModal } from './MovementModal'
import type { InventoryRow, MovementHistoryRow } from '../types'

const MOVEMENT_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'gold' | 'outline' }> = {
  purchase: { label: 'Compra', variant: 'success' },
  sale: { label: 'Venta', variant: 'default' },
  adjustment: { label: 'Ajuste', variant: 'warning' },
  return: { label: 'Devolución', variant: 'gold' },
  cancellation: { label: 'Cancelación', variant: 'outline' },
  correction: { label: 'Corrección', variant: 'warning' },
  reservation: { label: 'Reserva', variant: 'default' },
  reservation_release: { label: 'Lib. reserva', variant: 'outline' },
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

type Props = {
  variant: InventoryRow
  history: MovementHistoryRow[]
}

export function VariantHistory({ variant, history }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Variant summary */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wide">{variant.productName}</h2>
            <p className="font-sans text-sm text-text-secondary mt-0.5">
              {variant.colorName} · Talla {variant.sizeName}
            </p>
            <p className="font-sans text-xs font-mono text-text-secondary mt-1">SKU: {variant.sku}</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg border border-accent-gold/50 hover:bg-accent-gold/10 text-accent-gold font-sans text-sm font-medium transition-colors self-start"
          >
            Registrar movimiento
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
          <div className="text-center">
            <p className="font-sans text-xs text-text-secondary uppercase tracking-wider mb-1">Stock</p>
            <p className={`font-display text-2xl ${variant.quantity === 0 ? 'text-error' : 'text-text-primary'}`}>
              {variant.quantity}
            </p>
          </div>
          <div className="text-center border-x border-border">
            <p className="font-sans text-xs text-text-secondary uppercase tracking-wider mb-1">Reservado</p>
            <p className="font-display text-2xl text-text-secondary">{variant.reserved}</p>
          </div>
          <div className="text-center">
            <p className="font-sans text-xs text-text-secondary uppercase tracking-wider mb-1">Disponible</p>
            <p className={`font-display text-2xl ${variant.available === 0 ? 'text-error' : variant.isLow ? 'text-warning' : 'text-success'}`}>
              {variant.available}
            </p>
          </div>
        </div>
      </div>

      {/* Movement history */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-sans text-sm font-semibold text-text-primary">
            Historial de movimientos
          </h3>
          <p className="font-sans text-xs text-text-secondary mt-0.5">
            Últimos {history.length} movimientos
          </p>
        </div>

        {history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-sans text-sm text-text-secondary">Sin movimientos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((mov) => {
              const meta = MOVEMENT_LABELS[mov.type] ?? { label: mov.type, variant: 'default' as const }
              const isPositive = mov.quantity > 0

              return (
                <div key={mov.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="shrink-0 pt-0.5">
                    <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`font-sans text-base font-semibold ${isPositive ? 'text-success' : 'text-error'}`}>
                        {isPositive ? '+' : ''}{mov.quantity}
                      </span>
                      <span className="font-sans text-xs text-text-secondary">
                        {formatDate(mov.createdAt)}
                      </span>
                    </div>
                    {mov.reason && (
                      <p className="font-sans text-sm text-text-primary mt-0.5 break-words">{mov.reason}</p>
                    )}
                    {mov.performedByEmail && (
                      <p className="font-sans text-xs text-text-secondary mt-0.5">
                        por {mov.performedByEmail}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <MovementModal
        row={variant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
