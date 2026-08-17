'use client'

import { useEffect, useRef, useCallback, useState, useId } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useNavStore } from './nav-store'
import { cn } from '@/shared/lib/utils'
import type { SearchResult } from '@/domains/catalog/search'

const DEBOUNCE_MS = 300
const RECENT_KEY = 'savaya_recent_searches'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return
  try {
    const prev = getRecentSearches().filter((q) => q !== query)
    const next = [query, ...prev].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}

export function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useNavStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = useId()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Focus automático y carga de búsquedas recientes cuando se abre
  useEffect(() => {
    if (isSearchOpen) {
      // Cargar recientes y focus en el mismo tick via setTimeout
      // para evitar setState sincrónico dentro del efecto
      const t = setTimeout(() => {
        setRecentSearches(getRecentSearches())
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setQuery('')
        setResults([])
      }, 0)
      return () => clearTimeout(t)
    }
  }, [isSearchOpen])

  // Scroll lock
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isSearchOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    if (isSearchOpen) {
      document.addEventListener('keydown', handleKey)
    }
    return () => document.removeEventListener('keydown', handleKey)
  }, [isSearchOpen, closeSearch])

  // Búsqueda con debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const trimmed = query.trim()

    debounceTimer.current = setTimeout(async () => {
      if (!trimmed || trimmed.length < 2) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        const data = (await res.json()) as { results: SearchResult[] }
        setResults(data.results ?? [])
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, trimmed ? DEBOUNCE_MS : 0)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query])

  const handleResultClick = useCallback(
    (slug: string, type: 'product' | 'category') => {
      const trimmed = query.trim()
      if (trimmed.length >= 2) saveRecentSearch(trimmed)
      closeSearch()
      void slug
      void type
    },
    [query, closeSearch],
  )

  if (!isSearchOpen) return null

  const showRecent = query.trim() === '' && recentSearches.length > 0
  const showResults = query.trim().length >= 2

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar productos"
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* Overlay backdrop */}
      <div
        aria-hidden="true"
        onClick={closeSearch}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Panel de búsqueda */}
      <div className="relative z-10 bg-surface shadow-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              {isLoading ? <SpinnerIcon /> : <SearchIcon />}
            </span>
            <input
              ref={inputRef}
              id={id}
              type="search"
              autoFocus
              autoComplete="off"
              placeholder="Buscar sandalias, tacones, sneakers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                'w-full h-14 pl-12 pr-14',
                'font-sans text-base text-text-primary placeholder:text-text-secondary',
                'bg-surface-2 border border-border rounded-md',
                'focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30',
                'transition-colors duration-150',
              )}
            />
            <button
              type="button"
              aria-label="Cerrar búsqueda"
              onClick={closeSearch}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'h-8 w-8 flex items-center justify-center rounded-sm',
                'text-text-secondary hover:text-text-primary hover:bg-white/8',
                'transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
              )}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Búsquedas recientes */}
          {showRecent && (
            <div className="mt-4">
              <p className="font-sans text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Búsquedas recientes
              </p>
              <ul className="flex flex-wrap gap-2">
                {recentSearches.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => setQuery(q)}
                      className={cn(
                        'px-3 py-1.5 rounded-full border border-border',
                        'font-sans text-sm text-text-secondary',
                        'hover:border-accent-gold hover:text-accent-gold',
                        'transition-colors duration-150',
                        'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                      )}
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultados */}
          {showResults && (
            <div className="mt-4">
              {results.length === 0 && !isLoading && (
                <p className="font-sans text-sm text-text-secondary text-center py-4">
                  No encontramos resultados para &ldquo;{query}&rdquo;
                </p>
              )}

              {results.length > 0 && (
                <ul className="divide-y divide-border">
                  {results.map((result) => {
                    const href =
                      result.type === 'product'
                        ? `/producto/${result.slug}`
                        : `/${result.slug}`

                    return (
                      <li key={result.id}>
                        <Link
                          href={href}
                          onClick={() => handleResultClick(result.slug, result.type)}
                          className={cn(
                            'flex items-center gap-4 py-3',
                            'hover:bg-surface-2 -mx-2 px-2 rounded-md',
                            'transition-colors duration-100',
                            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                          )}
                        >
                          {/* Thumbnail */}
                          {result.imageUrl ? (
                            <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-border">
                              <Image
                                src={result.imageUrl}
                                alt={result.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-surface-2 border border-border flex items-center justify-center shrink-0 text-text-secondary">
                              <CategoryIcon />
                            </div>
                          )}

                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-sans text-sm text-text-primary truncate">
                              {result.name}
                            </span>
                            {result.type === 'product' && result.price !== undefined && (
                              <span className="font-sans text-xs text-text-secondary">
                                ${result.price.toFixed(2)} USD
                              </span>
                            )}
                            {result.type === 'category' && (
                              <span className="font-sans text-xs text-text-secondary capitalize">
                                Categoría
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Ayuda cuando el input está vacío y no hay recientes */}
          {!showRecent && !showResults && (
            <p className="mt-4 font-sans text-sm text-text-secondary text-center">
              Escribe al menos 2 caracteres para buscar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-spin">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CategoryIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
