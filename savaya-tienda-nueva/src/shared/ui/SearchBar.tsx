'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/shared/lib/utils'

export type SearchResult = {
  type: 'product' | 'category'
  id: string
  name: string
  slug: string
  imageUrl?: string
  price?: number
}

export type SearchBarProps = {
  onSearch: (query: string) => Promise<SearchResult[]>
  placeholder?: string
  className?: string
}

const MAX_RECENT = 5
const RECENT_KEY = 'savaya_recent_searches'
const DEBOUNCE_MS = 300

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CategoryIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin shrink-0">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

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
    // silently ignore storage errors
  }
}

export function SearchBar({
  onSearch,
  placeholder = 'Buscar productos...',
  className,
}: SearchBarProps) {
  const router = useRouter()
  const id = useId()
  const listboxId = `${id}-listbox`

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Construye los ítems visibles en el dropdown
  const showRecent = isOpen && query.trim() === ''
  const showResults = isOpen && query.trim().length > 0

  const items: (SearchResult | { type: 'recent'; id: string; name: string; slug: string })[] =
    showRecent
      ? recentSearches.map((q) => ({ type: 'recent' as const, id: q, name: q, slug: '' }))
      : showResults
      ? results
      : []

  const totalItems = items.length

  const navigateToResult = useCallback(
    (item: SearchResult | { type: 'recent'; id: string; name: string; slug: string }) => {
      if (item.type === 'recent') {
        setQuery(item.name)
        inputRef.current?.focus()
        return
      }
      const href =
        item.type === 'product' ? `/producto/${item.slug}` : `/categoria/${item.slug}`
      saveRecentSearch(query.trim())
      setIsOpen(false)
      router.push(href)
    },
    [query, router],
  )

  // Búsqueda con debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const trimmed = query.trim()

    // Resetear resultados después de un tick para no llamar setState sincronamente
    debounceTimer.current = setTimeout(
      async () => {
        if (!trimmed) {
          setResults([])
          setIsLoading(false)
          setActiveIndex(-1)
          return
        }

        setIsLoading(true)
        try {
          const res = await onSearch(trimmed)
          setResults(res)
          setActiveIndex(-1)
        } catch {
          setResults([])
        } finally {
          setIsLoading(false)
        }
      },
      trimmed ? DEBOUNCE_MS : 0,
    )

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, onSearch])

  // Cierre al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!isOpen || totalItems === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      navigateToResult(items[activeIndex])
    }
  }

  const activeDescendant = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
          {isLoading ? <Spinner /> : <SearchIcon />}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          aria-label="Buscar"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            setIsOpen(true)
            setRecentSearches(getRecentSearches())
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full h-11 pl-9 pr-4',
            'font-sans text-sm text-text-primary placeholder:text-text-secondary',
            'bg-surface border border-border rounded-sm',
            'focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30',
            'transition-colors duration-150',
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className={cn(
            'absolute top-full left-0 right-0 mt-1 z-50',
            'bg-surface border border-border rounded-md shadow-lg',
            'overflow-hidden',
          )}
        >
          {/* Búsquedas recientes */}
          {showRecent && recentSearches.length > 0 && (
            <div>
              <p className="px-3 pt-3 pb-1 font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">
                Búsquedas recientes
              </p>
              <ul>
                {recentSearches.map((q, i) => (
                  <li key={q}>
                    <button
                      id={`${id}-option-${i}`}
                      role="option"
                      aria-selected={activeIndex === i}
                      type="button"
                      onClick={() => {
                        setQuery(q)
                        inputRef.current?.focus()
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5',
                        'font-sans text-sm text-text-primary text-left',
                        'hover:bg-surface-2 transition-colors duration-100',
                        activeIndex === i && 'bg-surface-2',
                      )}
                    >
                      <SearchIcon />
                      <span>{q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultados */}
          {showResults && (
            <>
              {results.length === 0 && !isLoading && (
                <p className="px-3 py-4 font-sans text-sm text-text-secondary text-center">
                  No encontramos resultados para &ldquo;{query}&rdquo;
                </p>
              )}
              {results.length > 0 && (
                <ul>
                  {results.map((result, i) => (
                    <li key={result.id}>
                      <button
                        id={`${id}-option-${i}`}
                        role="option"
                        aria-selected={activeIndex === i}
                        type="button"
                        onClick={() => navigateToResult(result)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5',
                          'hover:bg-surface-2 transition-colors duration-100',
                          activeIndex === i && 'bg-surface-2',
                        )}
                      >
                        {/* Thumbnail */}
                        {result.imageUrl ? (
                          <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-border">
                            <Image
                              src={result.imageUrl}
                              alt={result.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-border flex items-center justify-center shrink-0 text-text-secondary">
                            <CategoryIcon />
                          </div>
                        )}

                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="font-sans text-sm text-text-primary truncate w-full text-left">
                            {result.name}
                          </span>
                          {result.type === 'product' && result.price !== undefined && (
                            <span className="font-sans text-xs text-text-secondary">
                              ${result.price.toFixed(2)}
                            </span>
                          )}
                          {result.type === 'category' && (
                            <span className="font-sans text-xs text-text-secondary">Categoría</span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Empty state cuando el input está vacío y no hay recientes */}
          {showRecent && recentSearches.length === 0 && (
            <p className="px-3 py-4 font-sans text-sm text-text-secondary text-center">
              Empieza a escribir para buscar
            </p>
          )}
        </div>
      )}
    </div>
  )
}
