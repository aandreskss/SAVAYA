'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui'
import { applyManualMovementAction } from '../actions'
import type { InventoryRow } from '../types'

const TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra / Entrada',
  adjustment: 'Ajuste',
  correction: 'Corrección',
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  purchase: 'Ingreso de mercancía nueva. Siempre suma.',
  adjustment: 'Ajuste por conteo físico. Puede sumar o restar.',
  correction: 'Corrección de error en un movimiento previo.',
}

type Props = {
  row: InventoryRow
  isOpen: boolean
  onClose: () => void
}

export function MovementModal({ row, isOpen, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<'purchase' | 'adjustment' | 'correction'>('purchase')
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')

  function reset() {
    setType('purchase')
    setDelta('')
    setReason('')
  }

  function handleClose() {
    if (isPending) return
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const deltaNum = parseInt(delta, 10)
    if (isNaN(deltaNum) || deltaNum === 0) {
      toast.error('La cantidad no puede ser cero')
      return
    }

    startTransition(async () => {
      const result = await applyManualMovementAction({
        variantId: row.variantId,
        type,
        delta: deltaNum,
        reason: reason.trim(),
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Movimiento registrado')
      reset()
      onClose()
    })
  }

  const deltaNum = parseInt(delta, 10)
  const isNegative = !isNaN(deltaNum) && deltaNum < 0
  const projectedStock = !isNaN(deltaNum) ? row.quantity + deltaNum : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar movimiento"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Variant info */}
        <div className="bg-surface-2 rounded-lg px-4 py-3 text-sm">
          <p className="font-sans font-medium text-text-primary">{row.productName}</p>
          <p className="font-sans text-text-secondary text-xs mt-0.5">
            {row.colorName} · Talla {row.sizeName} · SKU {row.sku}
          </p>
          <div className="flex gap-4 mt-2 text-xs font-sans text-text-secondary">
            <span>En stock: <strong className="text-text-primary">{row.quantity}</strong></span>
            <span>Reservado: <strong className="text-text-primary">{row.reserved}</strong></span>
            <span>Disponible: <strong className="text-text-primary">{row.available}</strong></span>
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block font-sans text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Tipo de movimiento
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['purchase', 'adjustment', 'correction'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-2 rounded-lg border text-xs font-sans font-medium transition-colors ${
                  type === t
                    ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                    : 'border-border text-text-secondary hover:border-border-hover hover:text-text-primary'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <p className="font-sans text-xs text-text-secondary mt-1.5">{TYPE_DESCRIPTIONS[type]}</p>
        </div>

        {/* Delta */}
        <div>
          <label className="block font-sans text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">
            Cantidad{' '}
            <span className="normal-case text-text-secondary font-normal">
              (positivo para agregar, negativo para restar)
            </span>
          </label>
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="Ej: 10 ó -3"
            required
            className="h-10 w-full px-3 rounded-sm border border-border bg-surface font-sans text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
          />
          {projectedStock !== null && (
            <p className={`font-sans text-xs mt-1 ${projectedStock < 0 ? 'text-error' : isNegative ? 'text-warning' : 'text-success'}`}>
              Stock resultante: {projectedStock}{' '}
              {projectedStock < 0 && '— no se puede reducir por debajo de 0'}
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block font-sans text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">
            Motivo <span className="text-error">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el motivo del movimiento..."
            required
            minLength={3}
            rows={3}
            className="w-full px-3 py-2 rounded-sm border border-border bg-surface font-sans text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={isPending}>
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
