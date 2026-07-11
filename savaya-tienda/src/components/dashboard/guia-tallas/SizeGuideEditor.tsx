'use client'

import { useState, useTransition } from 'react'
import { updateSizeGuide, type GuideType, type GuideData } from './actions'

const TYPE_LABELS: Record<GuideType, string> = {
  clothing: 'Ropa',
  shoes: 'Zapatos',
  accessories: 'Accesorios',
}

const TYPES: GuideType[] = ['clothing', 'shoes', 'accessories']

// ─── Table editor ─────────────────────────────────────────────────────────────

function TableEditor({ guide, onChange }: { guide: GuideData; onChange: (g: GuideData) => void }) {
  function setHeader(i: number, val: string) {
    const headers = [...guide.headers]
    headers[i] = val
    onChange({ ...guide, headers })
  }

  function setCell(ri: number, ci: number, val: string) {
    const rows = guide.rows.map((r) => [...r])
    if (!rows[ri]) rows[ri] = Array(guide.headers.length).fill('')
    rows[ri][ci] = val
    onChange({ ...guide, rows })
  }

  function addRow() {
    onChange({ ...guide, rows: [...guide.rows, Array(guide.headers.length).fill('')] })
  }

  function removeRow(i: number) {
    onChange({ ...guide, rows: guide.rows.filter((_, idx) => idx !== i) })
  }

  if (guide.headers.length === 0) {
    return (
      <p className="text-xs text-gray-text py-6 text-center border border-dashed border-gray-light rounded">
        No hay datos. Ejecuta el SQL inicial para crear la guía predeterminada.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {guide.headers.map((h, i) => (
              <th key={i} className="pb-2 pr-2 text-left font-medium">
                <input
                  value={h}
                  onChange={(e) => setHeader(i, e.target.value)}
                  placeholder={`Columna ${i + 1}`}
                  className="w-full border border-gray-light rounded px-2 py-1.5 text-xs font-semibold bg-gray-bg focus:outline-none focus:border-black"
                />
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {guide.rows.map((row, ri) => (
            <tr key={ri} className="border-t border-gray-bg">
              {guide.headers.map((_, ci) => (
                <td key={ci} className="py-1 pr-2">
                  <input
                    value={row[ci] ?? ''}
                    onChange={(e) => setCell(ri, ci, e.target.value)}
                    className="w-full border border-gray-light rounded px-2 py-1.5 text-xs focus:outline-none focus:border-black"
                  />
                </td>
              ))}
              <td className="py-1">
                <button
                  type="button"
                  onClick={() => removeRow(ri)}
                  title="Eliminar fila"
                  className="w-6 h-6 flex items-center justify-center text-gray-text hover:text-sale transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 w-full h-8 border border-dashed border-gray-light rounded text-xs text-gray-text hover:border-black hover:text-black transition-colors"
      >
        + Agregar fila
      </button>
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export default function SizeGuideEditor({
  initial,
}: {
  initial: Record<GuideType, GuideData>
}) {
  const [activeTab, setActiveTab] = useState<GuideType>('clothing')
  const [guides, setGuides] = useState<Record<GuideType, GuideData>>(initial)
  const [savedTab, setSavedTab] = useState<GuideType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave(type: GuideType) {
    setSavedTab(null)
    setError(null)
    startTransition(async () => {
      try {
        await updateSizeGuide(type, guides[type])
        setSavedTab(type)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-light mb-5">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-heading font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === t
                ? 'border-black text-black'
                : 'border-transparent text-gray-text hover:text-black'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Editor per type */}
      {TYPES.map((t) => (
        <div key={t} className={t === activeTab ? '' : 'hidden'}>
          <TableEditor
            guide={guides[t]}
            onChange={(g) => {
              setGuides((prev) => ({ ...prev, [t]: g }))
              setSavedTab(null)
            }}
          />
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-light">
            <button
              type="button"
              onClick={() => handleSave(t)}
              disabled={isPending}
              className="h-9 px-4 bg-black text-white text-xs font-heading font-semibold rounded hover:bg-accent transition-colors disabled:opacity-40"
            >
              {isPending ? 'Guardando…' : 'Guardar guía'}
            </button>
            {savedTab === t && !isPending && (
              <span className="text-xs text-green-600 font-medium">✓ Guardado</span>
            )}
            {error && !isPending && (
              <span className="text-xs text-sale">{error}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
