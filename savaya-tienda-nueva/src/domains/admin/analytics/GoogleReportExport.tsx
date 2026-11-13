'use client'

import { useState } from 'react'
import type { DateRange } from './google-report-model'

export function GoogleReportExport({ range }: { range: DateRange }) {
  const [busy, setBusy] = useState<'sheets' | 'csv' | null>(null)
  const [error, setError] = useState('')
  const [sheetUrl, setSheetUrl] = useState('')
  const endpoint = `/api/admin/reports/google?${new URLSearchParams(range)}`
  async function createSheet() {
    setBusy('sheets'); setError(''); setSheetUrl('')
    try {
      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'No se pudo crear el informe.')
      setSheetUrl(data.url)
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo crear el informe.') }
    finally { setBusy(null) }
  }
  async function downloadCsv() {
    setBusy('csv'); setError('')
    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'No se pudo descargar el informe.')
      }
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `savaya-ga4-${range.from}-${range.to}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo descargar el informe.') }
    finally { setBusy(null) }
  }
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-3 items-center">
      <button type="button" disabled={!!busy} onClick={createSheet} className="px-4 py-2 text-sm rounded border border-accent-gold text-accent-gold disabled:opacity-50">
        {busy === 'sheets' ? 'Creando informe…' : 'Crear informe en Google Sheets'}
      </button>
      <button type="button" disabled={!!busy} onClick={downloadCsv} className="text-sm text-text-secondary underline disabled:opacity-50">{busy === 'csv' ? 'Descargando…' : 'Descargar CSV'}</button>
    </div>
    <p className="text-xs text-text-muted">Se crea un documento en la cuenta de Google conectada, con una pestaña por sección y las fechas seleccionadas.</p>
    {sheetUrl && <p role="status" className="text-sm"><a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-accent-gold underline">Informe creado · Abrir Google Sheets ↗</a></p>}
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
  </div>
}
