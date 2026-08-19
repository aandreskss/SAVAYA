'use client'

import { useState, useTransition } from 'react'
import { Button, Badge } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { setManualRateAction, setActiveDisplayRateAction } from '../actions'
import type { AdminExchangeRate } from '../types'
import type { BadgeVariant } from '@/shared/ui/Badge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sourceLabel(source: string, isManual: boolean): { label: string; variant: BadgeVariant } {
  if (isManual) return { label: 'Manual', variant: 'warning' }
  if (source.includes('bcv')) return { label: 'BCV API', variant: 'success' }
  if (source.includes('fallback')) return { label: 'Fallback', variant: 'default' }
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
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Override form
// ---------------------------------------------------------------------------

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold placeholder:text-text-secondary/50'
const labelCls = 'block text-xs font-medium text-text-secondary mb-1'

function OverrideForm({
  currency,
  currentRate,
  onSubmit,
  onCancel,
  isPending,
}: {
  currency: 'usd' | 'eur'
  currentRate: number
  onSubmit: (rateVes: number, reason: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [rateStr, setRateStr] = useState(currentRate.toFixed(2))
  const [reason, setReason] = useState('')
  const symbol = currency === 'eur' ? '€' : '$'

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(Number(rateStr), reason) }}
      className="border border-warning/40 bg-warning/5 rounded-xl p-5 flex flex-col gap-4"
    >
      <p className="text-sm font-medium text-warning">
        Fijar tasa manual — {currency === 'eur' ? 'Euro BCV' : 'Dólar BCV'}
      </p>
      <p className="text-xs text-text-secondary">
        Sobrescribe la tasa actual. Queda registrada en el historial con tu nombre y el motivo indicado.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nueva tasa (Bs./{symbol}) *</label>
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
            <span className="font-semibold text-text-primary">{currentRate.toFixed(2)} Bs./{symbol}</span>
          </p>
        </div>
      </div>
      <div>
        <label className={labelCls}>Motivo * (mín. 5 caracteres)</label>
        <input
          required
          className={inputCls}
          placeholder={`Ej: BCV actualizó la tasa ${currency === 'eur' ? 'euro' : 'dólar'} oficial a las 11am`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" type="button" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" isLoading={isPending} className="flex-1">Aplicar tasa</Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Rate card
// ---------------------------------------------------------------------------

function RateCard({
  currency,
  current,
  canOverride,
  isOverrideOpen,
  onToggleOverride,
}: {
  currency: 'usd' | 'eur'
  current: AdminExchangeRate | null
  canOverride: boolean
  isOverrideOpen: boolean
  onToggleOverride: () => void
}) {
  const symbol = currency === 'eur' ? '€' : '$'
  const label = currency === 'eur' ? 'Euro BCV' : 'Dólar BCV'
  const si = current ? sourceLabel(current.source, current.isManualOverride) : null

  return (
    <div className="border border-border bg-surface rounded-xl p-5 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-3">{label}</p>
      {current ? (
        <>
          <p className="font-display text-4xl tracking-tight text-text-primary">
            {current.rateVes.toFixed(2)}
            <span className="text-lg text-text-secondary ml-1.5">Bs./{symbol}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {si && <Badge variant={si.variant} size="sm">{si.label}</Badge>}
            <span className="text-xs text-text-secondary">{timeAgo(current.createdAt)}</span>
            {current.isManualOverride && current.overrideByName && (
              <span className="text-xs text-text-secondary">· {current.overrideByName}</span>
            )}
          </div>
          {current.isManualOverride && current.overrideReason && (
            <p className="text-xs text-text-secondary/70 mt-1.5 italic">
              &ldquo;{current.overrideReason}&rdquo;
            </p>
          )}
          {canOverride && (
            <button
              type="button"
              onClick={onToggleOverride}
              className="mt-4 text-xs font-medium text-text-secondary hover:text-accent-gold transition-colors underline-offset-2 hover:underline"
            >
              {isOverrideOpen ? 'Cancelar override' : 'Fijar tasa manual'}
            </button>
          )}
        </>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-text-secondary">Sin datos.</p>
          <p className="text-xs text-text-secondary/60 mt-1">Usando fallback.</p>
          {canOverride && (
            <button
              type="button"
              onClick={onToggleOverride}
              className="mt-3 text-xs font-medium text-accent-gold hover:underline underline-offset-2"
            >
              Cargar primera tasa
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExchangeRatesManager
// ---------------------------------------------------------------------------

type Props = {
  history: AdminExchangeRate[]
  canOverride: boolean
  activeDisplayRate: 'usd' | 'eur'
}

export function ExchangeRatesManager({ history, canOverride, activeDisplayRate }: Props) {
  const usdHistory = history.filter((r) => r.currency === 'usd')
  const eurHistory = history.filter((r) => r.currency === 'eur')
  const [usdRates, setUsdRates] = useState(usdHistory)
  const [eurRates, setEurRates] = useState(eurHistory)
  const [displayRate, setDisplayRate] = useState<'usd' | 'eur'>(activeDisplayRate)
  const [overrideOpen, setOverrideOpen] = useState<'usd' | 'eur' | null>(null)
  const [isOverridePending, startOverrideTransition] = useTransition()
  const [isDisplayPending, startDisplayTransition] = useTransition()

  const usdCurrent = usdRates[0] ?? null
  const eurCurrent = eurRates[0] ?? null

  function handleOverride(currency: 'usd' | 'eur', rateVes: number, reason: string) {
    startOverrideTransition(async () => {
      const res = await setManualRateAction(currency, rateVes, reason)
      if (res.success) {
        if (currency === 'usd') setUsdRates((prev) => [res.data, ...prev])
        else setEurRates((prev) => [res.data, ...prev])
        setOverrideOpen(null)
        toast.success(`Tasa ${currency === 'eur' ? 'Euro' : 'USD'} actualizada`)
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDisplayRateChange(currency: 'usd' | 'eur') {
    if (currency === displayRate) return
    setDisplayRate(currency)
    startDisplayTransition(async () => {
      const res = await setActiveDisplayRateAction(currency)
      if (res.success) {
        toast.success(`Bs. en web: ${currency === 'eur' ? 'Tasa Euro BCV' : 'Tasa Dólar BCV'}`)
      } else {
        setDisplayRate(displayRate) // revert
        toast.error(res.error)
      }
    })
  }

  const combinedHistory = [...usdRates, ...eurRates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wide">Tasas de cambio</h1>
        <p className="text-sm text-text-secondary mt-1">Tasas BCV oficiales · USD y EUR → Bs.</p>
      </div>

      {/* Active display rate selector */}
      <div className="border border-border rounded-xl p-5 bg-surface">
        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-1">
          Tasa activa en la web
        </p>
        <p className="text-xs text-text-secondary mb-4">
          Define con qué tasa se calcula el monto en Bs. que ven los clientes en el carrito y checkout.
        </p>
        <div className="flex gap-3 flex-wrap">
          {(['usd', 'eur'] as const).map((c) => (
            <button
              key={c}
              type="button"
              disabled={isDisplayPending || !canOverride}
              onClick={() => handleDisplayRateChange(c)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                displayRate === c
                  ? 'bg-accent-gold text-brand-black border-accent-gold'
                  : 'border-border text-text-secondary hover:border-accent-gold/50 hover:text-text-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-base">{c === 'eur' ? '€' : '$'}</span>
              {c === 'eur' ? 'Euro BCV' : 'Dólar BCV'}
              {displayRate === c && (
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Activa</span>
              )}
            </button>
          ))}
        </div>
        {!canOverride && (
          <p className="text-xs text-text-secondary/60 mt-3">
            Solo <span className="font-semibold">super_admin</span> puede cambiar la tasa activa.
          </p>
        )}
      </div>

      {/* Rate cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        <RateCard
          currency="usd"
          current={usdCurrent}
          canOverride={canOverride}
          isOverrideOpen={overrideOpen === 'usd'}
          onToggleOverride={() => setOverrideOpen((v) => (v === 'usd' ? null : 'usd'))}
        />
        <RateCard
          currency="eur"
          current={eurCurrent}
          canOverride={canOverride}
          isOverrideOpen={overrideOpen === 'eur'}
          onToggleOverride={() => setOverrideOpen((v) => (v === 'eur' ? null : 'eur'))}
        />
      </div>

      {/* Override forms */}
      {overrideOpen && canOverride && (
        <OverrideForm
          currency={overrideOpen}
          currentRate={overrideOpen === 'eur' ? (eurCurrent?.rateVes ?? 53) : (usdCurrent?.rateVes ?? 48.5)}
          onSubmit={(rateVes, reason) => handleOverride(overrideOpen, rateVes, reason)}
          onCancel={() => setOverrideOpen(null)}
          isPending={isOverridePending}
        />
      )}

      {/* History */}
      {combinedHistory.length === 0 ? (
        <div className="border border-border border-dashed rounded-xl p-10 text-center text-text-secondary text-sm">
          Sin registros de tasa. Aparecerán aquí al aplicar una tasa manual o cuando el cron BCV esté activo.
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-surface border-b border-border px-5 py-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Historial ({combinedHistory.length} entradas)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Moneda</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Tasa (Bs.)</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Origen</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Motivo / Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {combinedHistory.map((r, i) => {
                  const info = sourceLabel(r.source, r.isManualOverride)
                  return (
                    <tr key={r.id} className={`bg-surface ${i === 0 ? 'bg-accent-gold/5' : ''}`}>
                      <td className="px-4 py-2.5 tabular-nums text-text-secondary text-xs">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${r.currency === 'eur' ? 'bg-blue-500/10 text-blue-400' : 'bg-success/10 text-success'}`}>
                          {r.currency === 'eur' ? '€ EUR' : '$ USD'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-semibold text-text-primary">
                        {r.rateVes.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={info.variant} size="sm">{info.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-text-secondary max-w-xs">
                        {r.overrideReason && <p className="truncate">{r.overrideReason}</p>}
                        {r.overrideByName && <p className="text-text-secondary/60">{r.overrideByName}</p>}
                        {!r.isManualOverride && !r.overrideReason && <span className="text-text-secondary/40">—</span>}
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
