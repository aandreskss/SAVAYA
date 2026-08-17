'use client'

import { useState, useTransition } from 'react'
import { Button, Badge } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { setManualRateAction } from '../actions'
import type { AdminExchangeRate } from '../types'
import type { BadgeVariant } from '@/shared/ui/Badge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sourceInfo(source: string, isManual: boolean): { label: string; variant: BadgeVariant } {
  if (isManual) return { label: 'Manual', variant: 'warning' }
  if (source === 'bcv-api') return { label: 'BCV API', variant: 'success' }
  if (source === 'fallback-dev' || source === 'fallback-no-data' || source === 'fallback-db-error')
    return { label: 'Fallback', variant: 'default' }
  return { label: source, variant: 'outline' }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function fmtDate(date: Date): string {
  return new Date(date).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Override form
// ---------------------------------------------------------------------------

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold placeholder:text-text-secondary/50'
const labelCls = 'block text-xs font-medium text-text-secondary mb-1'

function OverrideForm({
  currentRate,
  onSubmit,
  onCancel,
  isPending,
}: {
  currentRate: number
  onSubmit: (rateVes: number, reason: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [rateStr, setRateStr] = useState(currentRate.toFixed(2))
  const [reason, setReason] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(Number(rateStr), reason)
      }}
      className="border border-warning/40 bg-warning/5 rounded-xl p-5 flex flex-col gap-4"
    >
      <p className="text-sm font-medium text-warning">Fijar tasa manual</p>
      <p className="text-xs text-text-secondary">
        Esta acción sobrescribe la tasa actual. Queda registrada en el historial con tu nombre y el
        motivo indicado.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nueva tasa (Bs./$) *</label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            className={inputCls}
            value={rateStr}
            onChange={(e) => setRateStr(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <p className="text-xs text-text-secondary pb-2">
            Actual:{' '}
            <span className="font-semibold text-text-primary">{currentRate.toFixed(2)} Bs./$</span>
          </p>
        </div>
      </div>

      <div>
        <label className={labelCls}>Motivo * (mín. 5 caracteres)</label>
        <input
          required
          className={inputCls}
          placeholder="Ej: BCV actualizó la tasa oficial a las 11am"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" type="button" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isPending} className="flex-1">
          Aplicar tasa
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// ExchangeRatesManager
// ---------------------------------------------------------------------------

type Props = {
  history: AdminExchangeRate[]
  canOverride: boolean
}

export function ExchangeRatesManager({ history, canOverride }: Props) {
  const [rates, setRates] = useState(history)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const current = rates[0] ?? null

  function handleOverride(rateVes: number, reason: string) {
    startTransition(async () => {
      const res = await setManualRateAction(rateVes, reason)
      if (res.success) {
        setRates((prev) => [res.data, ...prev])
        setShowForm(false)
        toast.success('Tasa actualizada')
      } else {
        toast.error(res.error)
      }
    })
  }

  const si = current ? sourceInfo(current.source, current.isManualOverride) : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Tasas de cambio</h1>
          <p className="text-sm text-text-secondary mt-1">Historial de tasas BCV · USD → Bs.</p>
        </div>
      </div>

      {/* Current rate card */}
      <div className="border border-border bg-surface rounded-xl p-6 mb-5">
        {current ? (
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                Tasa actual
              </p>
              <p className="font-display text-5xl tracking-tight text-text-primary">
                {current.rateVes.toFixed(2)}
                <span className="text-xl text-text-secondary ml-2">Bs./$</span>
              </p>
              <div className="flex items-center gap-3 mt-3">
                {si && (
                  <Badge variant={si.variant} size="sm">
                    {si.label}
                  </Badge>
                )}
                <span className="text-xs text-text-secondary">{timeAgo(current.createdAt)}</span>
                {current.isManualOverride && current.overrideByName && (
                  <span className="text-xs text-text-secondary">
                    · por {current.overrideByName}
                  </span>
                )}
              </div>
              {current.isManualOverride && current.overrideReason && (
                <p className="text-xs text-text-secondary mt-2 italic">
                  &ldquo;{current.overrideReason}&rdquo;
                </p>
              )}
            </div>
            {canOverride && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Cancelar' : 'Fijar tasa manual'}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-text-secondary">Sin datos de tasa en la base de datos.</p>
            <p className="text-xs text-text-secondary/60 mt-1">
              Usando tasa de fallback (48.50 Bs./$)
            </p>
            {canOverride && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setShowForm((v) => !v)}
              >
                Cargar primera tasa
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Override form */}
      {showForm && canOverride && (
        <div className="mb-5">
          <OverrideForm
            currentRate={current?.rateVes ?? 48.5}
            onSubmit={handleOverride}
            onCancel={() => setShowForm(false)}
            isPending={isPending}
          />
        </div>
      )}

      {!canOverride && (
        <div className="border border-border rounded-xl px-5 py-3 mb-5 text-xs text-text-secondary bg-surface/50">
          Solo <span className="font-semibold">super_admin</span> puede fijar tasas manualmente.
          Para integración automática con BCV, configura el cron en Fase 6.x.
        </div>
      )}

      {/* History */}
      {rates.length === 0 ? (
        <div className="border border-border border-dashed rounded-xl p-10 text-center text-text-secondary text-sm">
          Sin registros de tasa. La primera entrada aparecerá aquí al aplicar una tasa manual o
          cuando el cron BCV esté activo.
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-surface border-b border-border px-5 py-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Historial (últimas {rates.length} entradas)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Tasa (Bs./$)
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Origen
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Motivo / Admin
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rates.map((r, i) => {
                  const info = sourceInfo(r.source, r.isManualOverride)
                  return (
                    <tr
                      key={r.id}
                      className={`bg-surface ${i === 0 ? 'bg-accent-gold/5' : ''}`}
                    >
                      <td className="px-4 py-2.5 tabular-nums text-text-secondary text-xs">
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-semibold text-text-primary">
                        {r.rateVes.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={info.variant} size="sm">
                          {info.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-text-secondary max-w-xs">
                        {r.overrideReason && (
                          <p className="truncate">{r.overrideReason}</p>
                        )}
                        {r.overrideByName && (
                          <p className="text-text-secondary/60">{r.overrideByName}</p>
                        )}
                        {!r.isManualOverride && !r.overrideReason && (
                          <span className="text-text-secondary/40">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
