'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseDateRange, type DateRange } from './google-report-model'

export function GoogleAnalyticsFilters({ range, today }: { range: DateRange; today: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  function navigate(next: DateRange) {
    try { parseDateRange(next.from, next.to, today) } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Revisa las fechas seleccionadas.')
      return
    }
    setError('')
    const query = new URLSearchParams(params.toString())
    query.set('from', next.from); query.set('to', next.to)
    startTransition(() => {
      if (next.from === range.from && next.to === range.to) router.refresh()
      else router.push(`/admin/analytics?${query}`, { scroll: false })
    })
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); navigate({ from, to }) }
  return <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <p className="text-xs font-medium text-text-secondary">Explora el rendimiento de tu tienda</p>
      <div className="flex flex-wrap gap-1" aria-label="Períodos rápidos">
        {[7, 30, 90].map(days => {
          const start = new Date(Date.parse(today) - (days - 1) * 86_400_000).toISOString().slice(0, 10)
          const selected = range.from === start && range.to === today
          return <button type="button" key={days} disabled={pending} aria-pressed={selected}
            onClick={() => { setFrom(start); setTo(today); navigate({ from: start, to: today }) }}
            className={`cursor-pointer rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 disabled:opacity-60 ${selected ? 'bg-accent-gold/15 text-text-primary ring-1 ring-accent-gold/40' : 'text-text-secondary hover:bg-surface-2'}`}>{days} días</button>
        })}
      </div>
    </div>
    <form onSubmit={submit} aria-busy={pending} className="flex flex-wrap items-end gap-3">
      <label className="flex-1 min-w-36 text-xs text-text-secondary">Desde
        <input name="from" type="date" required value={from} max={to || today} disabled={pending} onChange={event => setFrom(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2.5 text-sm text-text-primary" />
      </label>
      <span aria-hidden="true" className="hidden sm:block pb-3 text-text-muted">→</span>
      <label className="flex-1 min-w-36 text-xs text-text-secondary">Hasta
        <input name="to" type="date" required value={to} min={from} max={today} disabled={pending} onChange={event => setTo(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2.5 text-sm text-text-primary" />
      </label>
      <button type="submit" disabled={pending} className="group flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-accent-gold px-6 py-2.5 text-sm font-semibold text-brand-black shadow-sm cursor-pointer transition-all duration-200 hover:bg-accent-gold-hover motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md motion-safe:active:translate-y-0.5 motion-safe:active:scale-95 disabled:cursor-wait disabled:opacity-70">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`h-4 w-4 ${pending ? 'motion-safe:animate-spin' : 'motion-safe:transition-transform motion-safe:group-hover:rotate-45'}`}>
          <path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>{pending ? 'Consultando…' : 'Consultar período'}
      </button>
    </form>
    <p role="status" aria-live="polite" className="text-xs text-text-secondary mt-3">{pending ? 'Actualizando las métricas del período seleccionado…' : 'Compara automáticamente con el período anterior de igual duración.'}</p>
    {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
  </div>
}
