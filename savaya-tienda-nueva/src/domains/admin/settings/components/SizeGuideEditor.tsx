'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { updateSizeGuideAction } from '../actions'
import type { SizeGuideConfig, SizeGuideRow } from '../types'

type Props = {
  initialConfig: SizeGuideConfig
  canEdit: boolean
}

const inputCls =
  'w-full h-8 px-2 rounded border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold text-center'

export function SizeGuideEditor({ initialConfig, canEdit }: Props) {
  const [enabled, setEnabled] = useState(initialConfig.enabled)
  const [rows, setRows] = useState<SizeGuideRow[]>(initialConfig.rows)
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)

  function handleToggle() {
    if (!canEdit) return
    setEnabled((prev) => !prev)
    setIsDirty(true)
  }

  function handleRowChange(index: number, field: keyof SizeGuideRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    setIsDirty(true)
  }

  function handleAddRow() {
    setRows((prev) => [...prev, { ve: '', eu: '', cm: '' }])
    setIsDirty(true)
  }

  function handleDeleteRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  function handleSave() {
    if (rows.some((r) => !r.ve.trim() || !r.eu.trim() || !r.cm.trim())) {
      toast.error('Completa todos los campos antes de guardar')
      return
    }
    startTransition(async () => {
      const res = await updateSizeGuideAction(enabled, rows)
      if (res.success) {
        setIsDirty(false)
        toast.success('Guía de tallas guardada')
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border bg-surface-2/50 flex items-start gap-3">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Tabla de tallas</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Guía de conversión de tallas que aparece en el modal de cada producto. Puedes activarla, desactivarla o editar las filas.
          </p>
        </div>
        {/* Impact badge */}
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
          Productos
        </span>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={!canEdit || isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              enabled ? 'bg-green-500' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${enabled ? 'text-green-400' : 'text-text-secondary'}`}>
            {enabled ? 'Visible en productos' : 'Oculta'}
          </span>
        </div>

        {/* Table editor */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 pr-3 text-xs font-semibold text-text-secondary w-1/3">Talla VE</th>
                <th className="text-left pb-2 pr-3 text-xs font-semibold text-text-secondary w-1/3">Talla EU</th>
                <th className="text-left pb-2 pr-3 text-xs font-semibold text-text-secondary w-1/3">Largo (cm)</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/40 last:border-b-0">
                  <td className="py-1.5 pr-3">
                    <input
                      type="text"
                      className={inputCls}
                      value={row.ve}
                      disabled={!canEdit}
                      onChange={(e) => handleRowChange(i, 've', e.target.value)}
                      placeholder="35"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="text"
                      className={inputCls}
                      value={row.eu}
                      disabled={!canEdit}
                      onChange={(e) => handleRowChange(i, 'eu', e.target.value)}
                      placeholder="35"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="text"
                      className={inputCls}
                      value={row.cm}
                      disabled={!canEdit}
                      onChange={(e) => handleRowChange(i, 'cm', e.target.value)}
                      placeholder="22.5"
                    />
                  </td>
                  <td className="py-1.5 text-center">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(i)}
                        disabled={rows.length <= 1}
                        className="text-text-secondary hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Eliminar fila"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add row + Save */}
        {canEdit && (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="text-xs text-text-secondary hover:text-accent-gold transition-colors font-medium"
            >
              + Agregar fila
            </button>
            <Button
              size="sm"
              isLoading={isPending}
              disabled={!isDirty}
              onClick={handleSave}
            >
              Guardar cambios
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
