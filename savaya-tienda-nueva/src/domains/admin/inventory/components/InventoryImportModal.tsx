'use client'

import { useState, useRef } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { bulkUpdateInventoryAction } from '../actions'
import { toast } from '@/shared/ui/toast-store'

type ParsedRow = { sku: string; quantity: number }
type ResultRow = { sku: string; error: string }

// CSV format: sku,cantidad (accepts English header too: sku,quantity)
function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { rows: [], errors: ['El archivo está vacío o no tiene datos.'] }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/['"]/g, ''))
  const skuIdx = header.findIndex((h) => h === 'sku')
  const qtyIdx = header.findIndex((h) => ['cantidad', 'quantity', 'stock', 'qty'].includes(h))

  if (skuIdx === -1) return { rows: [], errors: ['Columna "sku" no encontrada en el encabezado.'] }
  if (qtyIdx === -1) return { rows: [], errors: ['Columna "cantidad" (o "quantity") no encontrada.'] }

  const rows: ParsedRow[] = []
  const errors: string[] = []

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return
    const cols = line.split(',').map((c) => c.trim().replace(/['"]/g, ''))
    const sku = cols[skuIdx] ?? ''
    const qty = parseInt(cols[qtyIdx] ?? '', 10)
    if (!sku) { errors.push(`Fila ${i + 2}: SKU vacío`); return }
    if (isNaN(qty) || qty < 0) { errors.push(`Fila ${i + 2}: cantidad inválida para ${sku}`); return }
    rows.push({ sku, quantity: qty })
  })

  return { rows, errors }
}

function downloadTemplate() {
  const csv = 'sku,cantidad\nSAV-XXX-BLK-35,10\nSAV-XXX-BLK-36,5\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla-inventario.csv'
  a.click()
  URL.revokeObjectURL(url)
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function InventoryImportModal({ isOpen, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [result, setResult] = useState<{ updated: number; failed: ResultRow[] } | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, errors } = parseCsv(text)
      setParsed(rows)
      setParseErrors(errors)
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handleImport() {
    if (parsed.length === 0 || isPending) return
    setIsPending(true)
    const res = await bulkUpdateInventoryAction(parsed)
    setIsPending(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    setResult(res.data)
    if (res.data.failed.length === 0) {
      toast.success(`${res.data.updated} variante${res.data.updated !== 1 ? 's' : ''} actualizadas`)
    } else {
      toast.error(`${res.data.updated} actualizadas, ${res.data.failed.length} con errores`)
    }
  }

  function handleClose() {
    setParsed([])
    setParseErrors([])
    setFileName('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar inventario desde CSV" size="md">
      <div className="space-y-5">
        {/* Instructions */}
        <div className="p-3 bg-surface-2 rounded-lg text-sm text-text-secondary space-y-1">
          <p>El archivo CSV debe tener dos columnas: <code className="font-mono text-xs bg-surface px-1 py-0.5 rounded">sku</code> y <code className="font-mono text-xs bg-surface px-1 py-0.5 rounded">cantidad</code>.</p>
          <p>Los valores reemplazan el stock actual (corrección absoluta).</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-xs text-accent-gold hover:underline flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Descargar plantilla CSV
          </button>
        </div>

        {/* File input */}
        {!result && (
          <div>
            <label className="block text-sm font-medium mb-2">Archivo CSV</label>
            <label className="flex items-center justify-center gap-3 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-gold/50 transition-colors">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFile}
              />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="text-text-secondary">
                <path d="M10 2v10M6 6l4-4 4 4M4 14h12v4H4v-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-text-secondary">
                {fileName || 'Haz clic o arrastra un archivo .csv'}
              </span>
            </label>
          </div>
        )}

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="p-3 bg-error/5 border border-error/20 rounded-lg space-y-1">
            {parseErrors.map((e, i) => (
              <p key={i} className="text-xs text-error">{e}</p>
            ))}
          </div>
        )}

        {/* Preview */}
        {parsed.length > 0 && !result && (
          <div>
            <p className="text-sm font-medium mb-2">{parsed.length} filas detectadas</p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-surface-2 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">SKU</th>
                    <th className="px-3 py-2 text-right font-medium text-text-secondary">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-2/50">
                      <td className="px-3 py-1.5 font-mono">{row.sku}</td>
                      <td className="px-3 py-1.5 text-right">{row.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results after import */}
        {result && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-success/10 border border-success/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-success">{result.updated}</p>
                <p className="text-xs text-text-secondary">Actualizadas</p>
              </div>
              <div className="flex-1 p-3 bg-error/10 border border-error/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-error">{result.failed.length}</p>
                <p className="text-xs text-text-secondary">Con errores</p>
              </div>
            </div>
            {result.failed.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-error/20 bg-error/5">
                {result.failed.map((f, i) => (
                  <div key={i} className="px-3 py-2 text-xs border-b border-error/10 last:border-0">
                    <span className="font-mono text-error">{f.sku}</span>
                    <span className="text-text-secondary ml-2">— {f.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isPending}
              disabled={parsed.length === 0 || parseErrors.length > 0}
              onClick={handleImport}
            >
              Importar {parsed.length > 0 ? `${parsed.length} filas` : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
