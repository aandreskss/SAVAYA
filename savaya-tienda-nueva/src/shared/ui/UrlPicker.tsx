'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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

// ---------------------------------------------------------------------------
// UrlPicker
// ---------------------------------------------------------------------------

export function UrlPicker({ value, onChange, placeholder = '/ruta...', className, required }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<SiteUrlOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [open])

  const handleOpen = useCallback(async () => {
    if (open) { setOpen(false); setSearch(''); return }
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

  return (
    <div ref={containerRef} className="relative">
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

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] max-h-80 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
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
      )}
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
