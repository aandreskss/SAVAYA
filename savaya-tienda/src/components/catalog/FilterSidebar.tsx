'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn, formatPrice } from '@/lib/utils'
import type { Gender } from '@/lib/types'
import { useCurrency } from '@/components/providers/CurrencyProvider'

// ─── Shared sub-components ────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      className={cn('transition-transform duration-200', open && 'rotate-180')}
    >
      <polyline points="2 5 7 10 12 5" />
    </svg>
  )
}

function Checkmark() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 3.5 6.5 9 1" />
    </svg>
  )
}

function FilterSection({
  title, children, open, onToggle,
}: {
  title: string
  children: React.ReactNode
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-gray-light pb-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-sm font-heading font-semibold hover:text-accent transition-colors"
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      <div className={cn(
        'overflow-hidden transition-all duration-300',
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      )}>
        {children}
      </div>
    </div>
  )
}

function DualRangeSlider({
  min, max, step, minVal, maxVal, onChange, onCommit,
}: {
  min: number; max: number; step: number
  minVal: number; maxVal: number
  onChange: (min: number, max: number) => void
  onCommit: () => void
}) {
  const minPct = ((minVal - min) / (max - min)) * 100
  const maxPct = ((maxVal - min) / (max - min)) * 100

  const thumbCls = cn(
    'absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent pointer-events-none',
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none',
    '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full',
    '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
    '[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-grab',
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none',
    '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full',
    '[&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white',
    '[&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-solid',
  )

  return (
    <div className="relative h-5 flex items-center mt-1">
      <div className="absolute inset-x-0 h-1 bg-gray-light rounded-full pointer-events-none">
        <div
          className="absolute h-full bg-accent rounded-full"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={minVal}
        onChange={(e) => onChange(Math.min(Number(e.target.value), maxVal - step), maxVal)}
        onMouseUp={onCommit} onTouchEnd={onCommit}
        className={thumbCls}
        style={{ zIndex: minVal > max - step * 2 ? 5 : 3 }}
      />
      <input
        type="range" min={min} max={max} step={step} value={maxVal}
        onChange={(e) => onChange(minVal, Math.max(Number(e.target.value), minVal + step))}
        onMouseUp={onCommit} onTouchEnd={onCommit}
        className={thumbCls}
        style={{ zIndex: 4 }}
      />
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_MAX = 500_000
const PRICE_STEP = 10_000

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'women', label: 'Mujer' },
  { value: 'men',   label: 'Hombre' },
  { value: 'kids',  label: 'Niños' },
]

// Maps Gender values to category_visibility keys
const GENDER_TO_KEY: Record<string, string> = {
  women: 'mujer',
  men:   'hombre',
  kids:  'ninos',
}

// ─── FilterSidebar ────────────────────────────────────────────────────────────

interface FilterSidebarProps {
  availableSizes: readonly string[]
  availableColors: readonly { readonly name: string; readonly hex: string }[]
  showGenderFilter?: boolean
  disabledCategories?: string[]
  open: boolean
  onClose: () => void
}

export default function FilterSidebar({
  availableSizes,
  availableColors,
  showGenderFilter = false,
  disabledCategories = [],
  open,
  onClose,
}: FilterSidebarProps) {
  const currency = useCurrency()
  const disabledSet = new Set(disabledCategories)
  const visibleGenders = GENDER_OPTIONS.filter(({ value }) => !disabledSet.has(GENDER_TO_KEY[value] ?? ''))
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse URL state
  const activeTallas  = searchParams.get('tallas')?.split(',').filter(Boolean)  ?? []
  const activeColores = searchParams.get('colores')?.split(',').filter(Boolean) ?? []
  const activeGeneros = searchParams.get('generos')?.split(',').filter(Boolean) ?? []
  const activeDesc    = searchParams.get('descuento') === 'true'
  const urlMin = Number(searchParams.get('precio_min') ?? 0)
  const urlMax = Number(searchParams.get('precio_max') ?? PRICE_MAX)

  const [minPrice, setMinPrice] = useState(urlMin)
  const [maxPrice, setMaxPrice] = useState(urlMax)
  useEffect(() => { setMinPrice(urlMin); setMaxPrice(urlMax) }, [urlMin, urlMax])

  const [sections, setSections] = useState({
    genero: true, precio: true, talla: true, color: true, descuento: true,
  })

  // ── URL helpers ────────────────────────────────────────────────────────────

  function apply(updates: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      v === null ? p.delete(k) : p.set(k, v)
    }
    p.delete('pagina')
    router.replace(`?${p}`, { scroll: false })
  }

  function toggleMulti(key: string, current: string[], value: string) {
    const s = new Set(current)
    s.has(value) ? s.delete(value) : s.add(value)
    apply({ [key]: s.size > 0 ? [...s].join(',') : null })
  }

  const commitPrice = useCallback(() => {
    apply({
      precio_min: minPrice > 0 ? String(minPrice) : null,
      precio_max: maxPrice < PRICE_MAX ? String(maxPrice) : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice, searchParams])

  // ── Active filter count (for badge on mobile button) ──────────────────────

  const activeCount =
    activeTallas.length + activeColores.length + activeGeneros.length +
    (activeDesc ? 1 : 0) +
    (urlMin > 0 || urlMax < PRICE_MAX ? 1 : 0)

  // ── Shared filter content ─────────────────────────────────────────────────

  const content = (
    <>
      <div className="flex items-center justify-between py-3 px-0.5 mb-1">
        <span className="font-heading font-semibold text-sm">
          Filtros{' '}
          {activeCount > 0 && <span className="text-accent">({activeCount})</span>}
        </span>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-text hover:text-black text-xl leading-none"
          aria-label="Cerrar filtros"
        >
          ×
        </button>
      </div>

      {/* ── Género (optional) ── */}
      {showGenderFilter && visibleGenders.length > 0 && (
        <FilterSection
          title="Género"
          open={sections.genero}
          onToggle={() => setSections((s) => ({ ...s, genero: !s.genero }))}
        >
          <div className="flex flex-col gap-2.5 pb-2">
            {visibleGenders.map(({ value, label }) => {
              const active = activeGeneros.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleMulti('generos', activeGeneros, value)}
                  className="flex items-center gap-2.5 text-sm w-full"
                  aria-pressed={active}
                >
                  <span className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    active ? 'bg-accent border-accent' : 'border-gray-light',
                  )}>
                    {active && <Checkmark />}
                  </span>
                  <span className={active ? 'font-semibold' : 'text-gray-text'}>{label}</span>
                </button>
              )
            })}
          </div>
        </FilterSection>
      )}

      {/* ── Precio ── */}
      <FilterSection
        title="Precio"
        open={sections.precio}
        onToggle={() => setSections((s) => ({ ...s, precio: !s.precio }))}
      >
        <div className="px-0.5 pb-2">
          <DualRangeSlider
            min={0} max={PRICE_MAX} step={PRICE_STEP}
            minVal={minPrice} maxVal={maxPrice}
            onChange={(mn, mx) => { setMinPrice(mn); setMaxPrice(mx) }}
            onCommit={commitPrice}
          />
          <div className="flex justify-between mt-3 text-xs text-gray-text">
            <span>{formatPrice(minPrice, currency)}</span>
            <span>{formatPrice(maxPrice, currency)}</span>
          </div>
        </div>
      </FilterSection>

      {/* ── Talla (hidden when empty, e.g. /accesorios) ── */}
      {availableSizes.length > 0 && (
        <FilterSection
          title="Talla"
          open={sections.talla}
          onToggle={() => setSections((s) => ({ ...s, talla: !s.talla }))}
        >
          <div className="flex flex-wrap gap-1.5 pb-2">
            {availableSizes.map((s) => (
              <button
                key={s}
                onClick={() => toggleMulti('tallas', activeTallas, s)}
                className={cn(
                  'h-9 min-w-[2.25rem] px-2 rounded border text-xs font-heading font-semibold transition-colors',
                  activeTallas.includes(s)
                    ? 'bg-accent text-white border-accent'
                    : 'border-gray-light hover:border-black',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* ── Color ── */}
      <FilterSection
        title="Color"
        open={sections.color}
        onToggle={() => setSections((s) => ({ ...s, color: !s.color }))}
      >
        <div className="flex flex-wrap gap-2 pb-2">
          {availableColors.map((c) => {
            const isBicolor = c.hex.includes('|')
            const [hex1, hex2] = isBicolor ? c.hex.split('|') : [c.hex, c.hex]
            const isWhite  = !isBicolor && c.hex.toUpperCase() === '#FFFFFF'
            const isActive = activeColores.includes(c.name)
            const swatchStyle = isBicolor
              ? { background: `linear-gradient(135deg, ${hex1} 50%, ${hex2} 50%)` }
              : { backgroundColor: c.hex, boxShadow: isWhite ? 'inset 0 0 0 1px #d5d5d5' : undefined }
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => toggleMulti('colores', activeColores, c.name)}
                aria-pressed={isActive}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all duration-150 overflow-hidden',
                  isActive
                    ? 'border-black scale-110 shadow'
                    : 'border-transparent hover:scale-105',
                )}
                style={swatchStyle}
              />
            )
          })}
        </div>
      </FilterSection>

      {/* ── Descuento ── */}
      <FilterSection
        title="Descuento"
        open={sections.descuento}
        onToggle={() => setSections((s) => ({ ...s, descuento: !s.descuento }))}
      >
        <button
          onClick={() => apply({ descuento: activeDesc ? null : 'true' })}
          className="flex items-center gap-2.5 text-sm pb-2 w-full"
          aria-pressed={activeDesc}
        >
          <span className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
            activeDesc ? 'bg-accent border-accent' : 'border-gray-light',
          )}>
            {activeDesc && <Checkmark />}
          </span>
          <span className={activeDesc ? 'font-semibold' : 'text-gray-text'}>
            Solo productos con descuento
          </span>
        </button>
      </FilterSection>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-52 shrink-0 self-start sticky top-4">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
          <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white flex flex-col shadow-2xl overflow-y-auto px-4 py-2">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
