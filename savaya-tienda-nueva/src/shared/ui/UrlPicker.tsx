'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getSiteUrlOptionsAction } from '@/domains/admin/cms/actions'
import type { SiteUrlOption, SiteUrlOptions } from '@/domains/admin/cms/actions'

// ---------------------------------------------------------------------------
// Static pages — always available, no DB fetch needed
// ---------------------------------------------------------------------------

const STATIC_PAGES: SiteUrlOption[] = [
  { label: 'Inicio', url: '/' },
  { label: 'Nosotros', url: '/nosotros' },
  { label: 'Tiendas', url: '/tiendas' },
  { label: 'Contacto', url: '/contacto' },
  { label: 'Guía de tallas', url: '/guia-de-tallas' },
  { label: 'Cambios y devoluciones', url: '/cambios-y-devoluciones' },
  { label: 'Preguntas frecuentes', url: '/preguntas-frecuentes' },
  { label: 'Envíos', url: '/envios' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

type DropdownPos = { top: number; left: number; width: number }

// ---------------------------------------------------------------------------
// UrlPicker
// ---------------------------------------------------------------------------

export function UrlPicker({ value, onChange, placeholder = '/ruta...', className, required }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<SiteUrlOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState<DropdownPos | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Compute dropdown position from anchor rect
  function computePos(): DropdownPos | null {
    const el = anchorRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 280),
    }
  }

  // Close on outside click (checks both anchor and portal dropdown)
  useEffect(() => {
    if (!open) return
    function handleDown(e: MouseEvent) {
      const target = e.target as Node
      if (
        anchorRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [open])

  // Reposition on scroll or resize while open
  useEffect(() => {
    if (!open) return
    function update() { setPos(computePos()) }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  const handleOpen = useCallback(async () => {
    if (open) { setOpen(false); setSearch(''); return }
    setPos(computePos())
    setOpen(true)
    if (!options) {
      setLoading(true)
      const result = await getSiteUrlOptionsAction()
      if (result.success) setOptions(result.data)
      setLoading(false)
    }
  }, [open, options])

  function pick(url: string) {
    onChange(url)
    setOpen(false)
    setSearch('')
  }

  const q = search.toLowerCase()
  function filterList(list: SiteUrlOption[]) {
    return q ? list.filter((o) => o.label.toLowerCase().includes(q) || o.url.toLowerCase().includes(q)) : list
  }

  const staticMatches = filterList(STATIC_PAGES)
  const catMatches = filterList(options?.categories ?? [])
  const collMatches = filterList(options?.collections ?? [])
  const prodMatches = filterList(options?.products ?? [])
  const totalResults = staticMatches.length + catMatches.length + collMatches.length + prodMatches.length

  const dropdown = open && pos ? (
    <div
      ref={dropdownRef}
      style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="max-h-80 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl"
    >
      {/* Search */}
      <div className="sticky top-0 bg-surface border-b border-border px-3 py-2">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full text-xs bg-transparent outline-none placeholder:text-text-muted text-text-primary"
        />
      </div>

      {loading && (
        <p className="px-3 py-3 text-xs text-text-secondary">Cargando...</p>
      )}

      {!loading && q && totalResults === 0 && (
        <p className="px-3 py-3 text-xs text-text-secondary">Sin resultados para &ldquo;{search}&rdquo;</p>
      )}

      {!loading && (
        <div className="py-1">
          <Section title="Páginas" items={staticMatches} onPick={pick} />
          <Section title="Categorías" items={catMatches} onPick={pick} />
          <Section title="Colecciones" items={collMatches} onPick={pick} />
          <Section title="Productos" items={prodMatches} onPick={pick} />
        </div>
      )}
    </div>
  ) : null

  return (
    <div ref={anchorRef}>
      {/* Input + trigger button */}
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={className}
        />
        <button
          type="button"
          onClick={handleOpen}
          title="Seleccionar URL del sitio"
          className="shrink-0 px-2.5 py-1.5 rounded border border-border bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-2/80 transition-colors text-xs font-sans"
        >
          Elegir
        </button>
      </div>

      {/* Render dropdown via portal so it escapes any overflow:hidden ancestors */}
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section helper
// ---------------------------------------------------------------------------

function Section({
  title,
  items,
  onPick,
}: {
  title: string
  items: SiteUrlOption[]
  onPick: (url: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="px-3 pt-2 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
        {title}
      </p>
      {items.map((item) => (
        <button
          key={item.url}
          type="button"
          onClick={() => onPick(item.url)}
          className="w-full flex items-baseline gap-2 px-3 py-1.5 text-left hover:bg-surface-2/60 transition-colors"
        >
          <span className="text-xs font-sans text-text-primary truncate">{item.label}</span>
          <span className="text-[10px] font-mono text-text-muted truncate">{item.url}</span>
        </button>
      ))}
    </div>
  )
}
