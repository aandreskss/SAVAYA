'use client'

import { useState } from 'react'

const PRESETS = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 90 días', days: 90 },
  { label: 'Este año', days: 365 },
]

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function SalesReportWidget() {
  const today = toDateString(new Date())
  const [from, setFrom] = useState(() =>
    toDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  )
  const [to, setTo] = useState(today)
  const [loading, setLoading] = useState(false)

  function applyPreset(days: number) {
    setFrom(toDateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000)))
    setTo(today)
  }

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/sales?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('Error al generar el reporte')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `savaya-ventas-${from}-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore — the download failing is obvious to the user
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="font-sans text-sm font-medium text-text-primary">Reporte de ventas</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Incluye pedidos, ingresos, ciudades, métodos de pago y top productos
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={loading || !from || !to}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-accent-gold bg-accent-gold/10 text-accent-gold font-sans text-sm font-medium hover:bg-accent-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v7M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Generando...' : 'Descargar CSV'}
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="px-3 py-1 rounded-full border border-border text-xs font-sans text-text-secondary hover:border-border-hover hover:text-text-primary transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary font-sans whitespace-nowrap">Desde</label>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 px-2 text-xs border border-border rounded font-sans bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary font-sans whitespace-nowrap">Hasta</label>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 px-2 text-xs border border-border rounded font-sans bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold"
          />
        </div>
      </div>

      <p className="mt-3 text-[11px] text-text-secondary">
        El archivo CSV se puede abrir directamente en Excel o Google Sheets.
      </p>
    </div>
  )
}
