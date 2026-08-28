'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import type { ImportProductResult, ImportProductsResponse } from '@/app/api/admin/catalog/import/route'

type Step = 'idle' | 'uploading' | 'done'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportProductsForm() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportProductsResponse | null>(null)

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Solo se aceptan archivos .csv')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
    setStep('idle')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function handleImport() {
    if (!file) return
    setError(null)
    setStep('uploading')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/admin/catalog/import', { method: 'POST', body: form })
      const json = (await res.json()) as ImportProductsResponse & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al importar')
      setResult(json)
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al importar')
      setStep('idle')
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
    setStep('idle')
  }

  // ── Status helpers ─────────────────────────────────────────────────────────

  function statusIcon(r: ImportProductResult) {
    if (r.status === 'created') return <span className="text-emerald-400 shrink-0 text-base leading-none">✓</span>
    if (r.status === 'skipped') return <span className="text-yellow-400 shrink-0 text-base leading-none">⚠</span>
    return <span className="text-red-400 shrink-0 text-base leading-none">✕</span>
  }

  function statusLabel(r: ImportProductResult) {
    if (r.status === 'created') return `Creado · ${r.variantsCreated} variante(s)`
    if (r.status === 'skipped') return 'Omitido — ya existe'
    return 'Error'
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Format hint */}
      <div className="rounded-xl border border-border bg-surface-2 px-4 py-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Formato del CSV
        </p>
        <p className="text-xs text-text-secondary mb-3">
          Una fila <code className="bg-surface px-1 rounded text-accent-gold">tipo=producto</code> por modelo, seguida de sus filas{' '}
          <code className="bg-surface px-1 rounded text-accent-gold">tipo=variante</code>.
          El mismo <code className="bg-surface px-1 rounded">sku_ref</code> puede usarse en varios colores del mismo producto — el sistema genera SKUs únicos automáticamente.
        </p>
        <code className="block text-[11px] leading-5 text-text-secondary bg-surface rounded-lg px-3 py-2 overflow-x-auto whitespace-pre">
          {`tipo,nombre,categoria,genero,precio_base,precio_comparacion,descripcion,color,hex_color,talla,sku_ref,precio,cantidad\nproducto,Sandalia Elegante,Damas,women,75.00,95.00,Sandalia importada,,,,,,\nvariante,,,,,,,Rojo,#C0392B,36,SAN-001,,10\nvariante,,,,,,,Rojo,#C0392B,37,SAN-001,,12\nvariante,,,,,,,Azul,#2980B9,36,SAN-001,,8\nvariante,,,,,,,Blanco,#F5F5F5,36,SAN-002,,5`}
        </code>
        <a
          href="/samples/savaya-productos-ejemplo.csv"
          download
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-gold transition-colors"
        >
          ↓ Descargar plantilla CSV
        </a>
      </div>

      {/* Dropzone / file selected */}
      {step !== 'done' && (
        <div className="flex flex-col gap-3">
          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {step !== 'uploading' && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-text-secondary underline hover:text-text-primary transition-colors"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none ${
                dragging
                  ? 'border-accent-gold bg-accent-gold/5'
                  : 'border-border hover:border-accent-gold/50 hover:bg-surface-2'
              }`}
            >
              <span className="text-3xl text-accent-gold">↑</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Arrastra o haz clic para subir</p>
                <p className="text-xs text-text-secondary mt-0.5">Solo archivos .csv</p>
              </div>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) handleFile(f)
            }}
            className="hidden"
          />

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-400">
              <span className="shrink-0">✕</span>
              {error}
            </p>
          )}

          {step === 'uploading' ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
              <p className="text-sm text-text-secondary">Importando productos…</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleImport}
              disabled={!file}
              className="self-start rounded-lg bg-accent-gold px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Importar productos
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {step === 'done' && result && (
        <div className="flex flex-col gap-4">

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Creados', value: result.created, color: 'text-emerald-400' },
              { label: 'Omitidos', value: result.skipped, color: 'text-yellow-400' },
              { label: 'Errores', value: result.errors, color: 'text-red-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-text-secondary mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {result.created > 0 && (
            <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/5 px-4 py-3">
              <p className="text-sm font-semibold text-accent-gold">
                {result.created} producto(s) · {result.variantsCreated} variante(s) en borrador
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Agrega imágenes y publica desde el editor de cada producto.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href="/admin/productos?status=draft"
                  className="inline-flex items-center gap-1 rounded-lg bg-accent-gold px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity"
                >
                  Ver borradores →
                </Link>
              </div>
            </div>
          )}

          {/* Per-product results table */}
          <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Producto</th>
                  <th className="px-3 py-2 text-left font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-2 font-medium text-text-primary">{r.nombre}</td>
                    <td className="px-3 py-2">
                      <span className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          {statusIcon(r)}
                          <span className={r.status === 'created' ? 'text-emerald-400 font-medium' : 'text-text-secondary'}>
                            {statusLabel(r)}
                          </span>
                        </span>
                        {r.status === 'error' && r.message && (
                          <span className="text-[10px] text-red-400 leading-snug pl-5">{r.message}</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 self-start text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            ↺ Nueva importación
          </button>
        </div>
      )}
    </div>
  )
}
