'use client'

import { useState, useEffect, useRef } from 'react'
import { updateVariantStock } from '@/app/dashboard/inventario/actions'

export type LowStockItem = {
  id: string
  sku: string
  size: string
  color: string
  stock: number
  product_name: string
}

export default function LowStockWidget({ items: initial }: { items: LowStockItem[] }) {
  const [items, setItems] = useState(initial)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-gray-text mb-2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-text font-body">Todo el stock está bien</p>
      </div>
    )
  }

  function handleSaved(id: string, newStock: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock: newStock } : i))
  }

  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-body font-medium text-black truncate">{item.product_name}</p>
            <p className="text-xs text-gray-text font-body">{item.size} · {item.color}</p>
          </div>
          <StockCell item={item} onSaved={handleSaved} />
        </li>
      ))}
    </ul>
  )
}

function StockCell({
  item,
  onSaved,
}: {
  item: LowStockItem
  onSaved: (id: string, newStock: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(item.stock))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setValue(String(item.stock)) }, [item.stock])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  async function save() {
    const n = parseInt(value, 10)
    if (isNaN(n) || n < 0) { setError('Inválido'); return }
    if (n === item.stock) { setEditing(false); return }
    setSaving(true)
    setError(null)
    const res = await updateVariantStock(item.id, n)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onSaved(item.id, n)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setValue(String(item.stock)); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-16 px-2 py-1 text-xs font-body border border-black rounded focus:outline-none text-center"
        />
        {saving && (
          <svg className="animate-spin text-gray-text shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
        )}
        {error && <span className="text-[10px] text-sale">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Clic para editar stock"
      className={`shrink-0 text-xs font-heading font-bold px-2 py-0.5 rounded cursor-pointer hover:opacity-70 transition-opacity ${
        item.stock <= 2 ? 'bg-sale/10 text-sale' : 'bg-yellow-50 text-yellow-700'
      }`}
    >
      {item.stock} ud{item.stock !== 1 ? 's' : ''}
    </button>
  )
}
