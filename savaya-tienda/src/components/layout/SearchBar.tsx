'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { cn, formatPrice } from '@/lib/utils'
import { useNavTheme } from './NavThemeContext'
import { useCurrency } from '@/components/providers/CurrencyProvider'
import type { SearchApiResponse } from '@/app/api/search/route'

// ─── localStorage helpers ─────────────────────────────────────────────────────

const RECENT_KEY = 'savaya-recent-searches'

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}

function saveRecent(term: string) {
  const next = [term, ...getRecent().filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 5)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8.5" r="5.5" /><line x1="13.5" y1="13.5" x2="18" y2="18" />
    </svg>
  )
}

function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ─── Dropdown content ─────────────────────────────────────────────────────────

interface DropdownProps {
  query: string
  result: SearchApiResponse | null
  loading: boolean
  recents: string[]
  onUpdateRecents: (r: string[]) => void
  onClose: () => void
}

function Dropdown({ query, result, loading, recents, onUpdateRecents, onClose }: DropdownProps) {
  const currency = useCurrency()
  const router = useRouter()
  const q = query.trim()

  function navigate(href: string, saveQuery?: string) {
    if (saveQuery) saveRecent(saveQuery)
    router.push(href)
    onClose()
  }

  // ── empty query: recent searches ──
  if (!q) {
    if (recents.length === 0) {
      return (
        <p className="px-5 py-6 text-sm text-center text-gray-text">
          Busca tus prendas favoritas…
        </p>
      )
    }
    return (
      <div className="py-1">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
            Búsquedas recientes
          </span>
          <button
            onClick={() => { localStorage.removeItem(RECENT_KEY); onUpdateRecents([]) }}
            className="text-[10px] text-gray-text hover:text-black underline underline-offset-2"
          >
            Borrar todo
          </button>
        </div>
        {recents.map((term) => (
          <div key={term} className="flex items-center justify-between px-4 hover:bg-gray-bg group">
            <button
              onClick={() => navigate(`/buscar?q=${encodeURIComponent(term)}`, term)}
              className="flex items-center gap-2.5 py-2.5 text-sm text-gray-text group-hover:text-black flex-1 text-left"
            >
              <ClockIcon />
              {term}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const updated = recents.filter((r) => r !== term)
                localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
                onUpdateRecents(updated)
              }}
              className="p-1 text-gray-text hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Eliminar ${term}`}
            >
              <CloseIcon size={12} />
            </button>
          </div>
        ))}
      </div>
    )
  }

  // ── loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-8 text-sm text-gray-text">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        Buscando…
      </div>
    )
  }

  // ── no results ──
  if (result && result.products.length === 0 && result.categories.length === 0) {
    return (
      <div className="p-5 text-center">
        <p className="text-sm text-gray-text mb-4">
          No encontramos resultados para <strong>"{q}"</strong>
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { label: 'Nuevas Colecciones', href: '/nuevas-colecciones' },
            { label: 'Descuentos', href: '/descuentos' },
            { label: 'Zapatos', href: '/zapatos' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="text-xs border border-gray-light rounded-full px-3 py-1.5 hover:border-black transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  if (!result) return null

  return (
    <div>
      {/* Products */}
      {result.products.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-1.5 text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
            Productos
          </p>
          {result.products.map((p) => (
            <Link
              key={p.id}
              href={`/${p.slug}`}
              onClick={() => { saveRecent(q); onClose() }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-bg transition-colors"
            >
              {p.images[0] && (
                <div className="relative w-10 h-[3.25rem] rounded overflow-hidden bg-gray-bg shrink-0">
                  <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2 leading-snug">{p.name}</p>
                <p className={cn('text-sm font-heading font-semibold mt-0.5', p.sale_price != null && 'text-sale')}>
                  {formatPrice(p.sale_price ?? p.base_price, currency)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Category chips */}
      {result.categories.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-light">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2.5">
            Categorías sugeridas
          </p>
          <div className="flex flex-wrap gap-2">
            {result.categories.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="text-xs border border-gray-light rounded-full px-3 py-1.5 hover:border-black hover:bg-gray-bg transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* See all */}
      <div className="border-t border-gray-light">
        <Link
          href={`/buscar?q=${encodeURIComponent(q)}`}
          onClick={() => { saveRecent(q); onClose() }}
          className="flex items-center justify-between px-4 py-3.5 text-sm font-heading font-semibold hover:bg-gray-bg transition-colors"
        >
          <span>
            Ver todos los resultados para &ldquo;<span className="font-bold">{q}</span>&rdquo;
          </span>
          <span className="text-gray-text ml-2">→</span>
        </Link>
      </div>
    </div>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useNavTheme()

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [recents, setRecents] = useState<string[]>([])

  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Close on navigation
  useEffect(() => {
    setIsOpen(false)
    setQuery('')
    setResult(null)
  }, [pathname])

  // Focus + load recents when opened
  useEffect(() => {
    if (!isOpen) return
    setRecents(getRecent())
    const timer = setTimeout(() => {
      const isMobile = window.innerWidth < 768
      ;(isMobile ? mobileInputRef : desktopInputRef).current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Keyboard: "/" to open, Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && !isOpen && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        setResult(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Click outside to close (desktop)
  useEffect(() => {
    if (!isOpen) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setQuery('')
        setResult(null)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isOpen])

  // Debounced search fetch
  useEffect(() => {
    clearTimeout(debounceRef.current!)
    const q = query.trim()
    if (q.length < 1) {
      setResult(null)
      setLoading(false)
      return
    }
    setLoading(true)
    // Shorter delay for single-char prefix search, normal delay for full queries
    const delay = q.length === 1 ? 150 : 280
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        setResult(await res.json())
      } catch {
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, delay)
    return () => clearTimeout(debounceRef.current!)
  }, [query])

  function open() { setIsOpen(true) }

  function close() {
    setIsOpen(false)
    setQuery('')
    setResult(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    saveRecent(q)
    router.push(`/buscar?q=${encodeURIComponent(q)}`)
    close()
  }

  const dropdown = (
    <Dropdown
      query={query}
      result={result}
      loading={loading && query.trim().length >= 1}
      recents={recents}
      onUpdateRecents={setRecents}
      onClose={close}
    />
  )

  return (
    <>
      {/* ── Desktop ── */}
      <div ref={containerRef} className="relative hidden md:flex items-center">
        <form onSubmit={handleSubmit}>
          <input
            ref={desktopInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar productos"
            className={cn(
              'absolute right-10 top-1/2 -translate-y-1/2 h-9 rounded text-sm',
              'border px-3 focus:outline-none',
              'focus:bg-white focus:text-black focus:placeholder:text-gray-text focus:border-gray-light',
              'transition-all duration-300 ease-out',
              theme === 'dark'
                ? 'bg-white/15 text-white placeholder:text-white/50 border-white/25'
                : 'bg-black/5 text-black placeholder:text-gray-text border-gray-light',
              isOpen
                ? 'w-64 lg:w-80 opacity-100 pointer-events-auto'
                : 'w-0 opacity-0 pointer-events-none border-transparent p-0',
            )}
          />
        </form>

        <button
          type="button"
          onClick={isOpen ? close : open}
          aria-label={isOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
          className={cn('p-2 transition-colors shrink-0', theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-black/70 hover:text-black')}
        >
          {isOpen ? <CloseIcon /> : <SearchIcon />}
        </button>

        {/* Desktop dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+1rem)] w-[22rem] bg-white shadow-2xl rounded border border-gray-light z-50 max-h-[75vh] overflow-y-auto">
            {dropdown}
          </div>
        )}
      </div>

      {/* ── Mobile trigger ── */}
      <button
        type="button"
        onClick={open}
        aria-label="Buscar"
        className={cn('md:hidden p-2 transition-colors', theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-black/70 hover:text-black')}
      >
        <SearchIcon />
      </button>

      {/* ── Mobile overlay ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden />

          {/* Panel */}
          <div className="absolute inset-x-0 top-0">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 h-16 bg-accent px-4 shadow-lg"
            >
              <span className="text-white/60 shrink-0 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar productos…"
                aria-label="Buscar productos"
                className="flex-1 h-9 bg-white/15 text-white placeholder:text-white/50 border border-white/25 rounded px-3 text-sm focus:outline-none focus:bg-white focus:text-black focus:placeholder:text-gray-text transition-colors"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar búsqueda"
                className="p-2 text-white/80 hover:text-white shrink-0"
              >
                <CloseIcon size={20} />
              </button>
            </form>

            {/* Mobile dropdown */}
            <div className="bg-white shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
              {dropdown}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
