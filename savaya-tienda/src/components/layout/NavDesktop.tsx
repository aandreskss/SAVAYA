'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useNavTheme } from './NavThemeContext'
import { cn } from '@/lib/utils'
import type { NavBanners, NavGenderEntry, NavCollection, NavBrand } from '@/lib/types'

// SAVAYA: solo género femenino
type MenuKey = 'mujer'

interface MegaColumn {
  title: string
  viewAll: string
  basePath: string
  items: { name: string; slug: string }[]
}

interface EditorialBanner {
  title: string
  subtitle: string
  image: string
  href: string
  cta: string
}

interface PromoBanner {
  badge: string
  title: string
  subtitle: string
  image: string
  href: string
  cta: string
}

interface MegaItem {
  key: MenuKey
  label: string
  href: string
  columns: MegaColumn[]
  editorial: EditorialBanner
  promo: PromoBanner
  navCollections: NavCollection[]
  brands: NavBrand[]
}

// Static editorial banners — Savaya: solo calzado femenino
const GENDER_EDITORIAL: Record<MenuKey, EditorialBanner> = {
  mujer: {
    title: 'Nueva Temporada',
    subtitle: 'Colección 2026',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&q=80&fit=crop',
    href: '/nuevas-colecciones',
    cta: 'Ver colección',
  },
}

const GENDER_PROMO_FALLBACK: Record<MenuKey, PromoBanner> = {
  mujer: {
    badge: 'Oferta especial',
    title: 'Hasta 40% OFF en calzado',
    subtitle: 'Solo por tiempo limitado — descuentos en toda la colección',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=300&q=80&fit=crop',
    href: '/descuentos',
    cta: 'Aprovechar ahora',
  },
}

interface SimpleNavItem {
  label: string
  href: string
  categoryKey: string
  special: 'gold' | 'sale' | null
}

// SAVAYA: flat shoe categories — no hombre/niños/accesorios/remates
const SIMPLE_NAV: SimpleNavItem[] = [
  { label: 'Casuales',           href: '/casuales',           categoryKey: 'casuales',           special: null },
  { label: 'Deportivos',         href: '/deportivos',         categoryKey: 'deportivos',         special: null },
  { label: 'De vestir',          href: '/de-vestir',          categoryKey: 'de-vestir',          special: null },
  { label: 'Nuevas colecciones', href: '/nuevas-colecciones', categoryKey: 'nuevas-colecciones', special: 'gold' },
  { label: 'Descuentos',         href: '/descuentos',         categoryKey: 'descuentos',         special: 'sale' },
  { label: 'Más vendidos',       href: '/mas-vendidos',       categoryKey: 'mas-vendidos',       special: null },
]

interface NavDesktopProps {
  disabledCategories?: string[]
  navBanners?: NavBanners
  navCategories?: NavGenderEntry[]
  navBrands?: NavBrand[]
}

function buildColumns(entry: NavGenderEntry): MegaColumn[] {
  const clothing = entry.subcategories.filter((s) => s.product_type === 'clothing')
  const shoes = entry.subcategories.filter((s) => s.product_type === 'shoes')
  const accessories = entry.subcategories.filter((s) => s.product_type === 'accessories')
  const cols: MegaColumn[] = []
  if (clothing.length) cols.push({ title: 'Ropa', viewAll: entry.href, basePath: entry.href, items: clothing })
  // SAVAYA: shoe subcategories use their own slug as route
  if (shoes.length) cols.push({ title: 'Zapatos', viewAll: entry.href, basePath: '', items: shoes.map(s => ({ ...s, href: `/${s.slug}` })) })
  return cols
}

export default function NavDesktop({ disabledCategories = [], navBanners, navCategories = [], navBrands = [] }: NavDesktopProps) {
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const brandsCloseTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const theme = useNavTheme()
  const disabled = new Set(disabledCategories)

  // Build mega nav from dynamic navCategories
  const visibleMega: MegaItem[] = navCategories
    .filter((entry) => !disabled.has(entry.key))
    .map((entry) => {
      const db = navBanners?.[entry.key]
      const fallback = GENDER_PROMO_FALLBACK[entry.key]
      return {
        key: entry.key,
        label: entry.label,
        href: entry.href,
        columns: buildColumns(entry),
        editorial: GENDER_EDITORIAL[entry.key],
        promo: {
          badge: db?.badge ?? fallback.badge,
          title: db?.title ?? fallback.title,
          subtitle: db?.subtitle ?? fallback.subtitle,
          image: db?.image_url ?? fallback.image,
          href: db?.href ?? fallback.href,
          cta: db?.cta_text ?? fallback.cta,
        },
        navCollections: entry.navCollections ?? [],
        brands: entry.brands ?? [],
      }
    })

  const visibleSimple = SIMPLE_NAV.filter((item) => !disabled.has(item.categoryKey))

  const megaWithBanners = visibleMega

  // Close mega menu on scroll
  useEffect(() => {
    function onScroll() {
      if (activeMenu) setActiveMenu(null)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [activeMenu])

  function openMenu(key: MenuKey) {
    clearTimeout(closeTimer.current!)
    setActiveMenu(key)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120)
  }

  function cancelClose() {
    clearTimeout(closeTimer.current!)
  }

  function openBrands() {
    clearTimeout(brandsCloseTimer.current!)
    setBrandsOpen(true)
    setActiveMenu(null)
  }

  function scheduleBrandsClose() {
    brandsCloseTimer.current = setTimeout(() => setBrandsOpen(false), 120)
  }

  function cancelBrandsClose() {
    clearTimeout(brandsCloseTimer.current!)
  }

  const activeMega = megaWithBanners.find((m) => m.key === activeMenu) ?? null

  const dividerClass = theme === 'dark' ? 'bg-white/20' : 'bg-black/15'

  return (
    <>
      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <nav className="hidden md:flex items-center gap-1">
        {megaWithBanners.map((item) => (
          <div
            key={item.key}
            onMouseEnter={() => openMenu(item.key)}
            onMouseLeave={scheduleClose}
          >
            <Link
              href={item.href}
              className={cn(
                'relative px-3 py-2 text-sm font-heading font-medium transition-colors',
                theme === 'dark' ? 'text-white/90 hover:text-white' : 'text-black/70 hover:text-black',
                activeMenu === item.key && 'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-gold'
              )}
            >
              {item.label}
            </Link>
          </div>
        ))}

        {visibleMega.length > 0 && visibleSimple.length > 0 && (
          <div className={cn('w-px h-4 mx-1', dividerClass)} />
        )}

        {/* MARCAS dropdown — only if there are active brands */}
        {navBrands.length > 0 && (
          <div
            className="relative"
            onMouseEnter={openBrands}
            onMouseLeave={scheduleBrandsClose}
          >
            <button
              type="button"
              className={cn(
                'relative px-3 py-2 text-sm font-heading font-medium transition-colors flex items-center gap-1',
                theme === 'dark' ? 'text-white/90 hover:text-white' : 'text-black/70 hover:text-black',
                brandsOpen && 'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-gold'
              )}
            >
              Marcas
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('transition-transform duration-150', brandsOpen && 'rotate-180')}>
                <polyline points="2 4 5 7 8 4" />
              </svg>
            </button>

            {brandsOpen && (
              <div
                className="absolute top-full left-0 z-30 mt-1 min-w-[160px] bg-white border border-gray-light rounded shadow-xl py-1"
                onMouseEnter={cancelBrandsClose}
                onMouseLeave={scheduleBrandsClose}
              >
                {navBrands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/marcas/${brand.slug}`}
                    onClick={() => setBrandsOpen(false)}
                    className="block px-4 py-2 text-sm font-body text-black/70 hover:text-black hover:bg-gray-bg transition-colors"
                  >
                    {brand.name}
                  </Link>
                ))}
                <div className="border-t border-gray-light mt-1 pt-1">
                  <Link
                    href="/marcas"
                    onClick={() => setBrandsOpen(false)}
                    className="block px-4 py-2 text-xs font-heading font-semibold text-gray-text hover:text-black hover:bg-gray-bg transition-colors"
                  >
                    Ver todas las marcas →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {visibleSimple.map(({ label, href, special }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-2 text-sm font-heading font-medium transition-colors',
              special === 'gold' && 'text-gold',
              special === 'sale' && 'text-sale font-bold',
              !special && (theme === 'dark' ? 'text-white/90 hover:text-white' : 'text-black/70 hover:text-black')
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* ── Mega panel ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed top-[94px] left-0 right-0 z-30 bg-white shadow-xl border-t border-gray-light',
          'transition-all duration-200 origin-top',
          activeMega
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        )}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {activeMega && (
          <div className="max-w-7xl mx-auto px-8 py-8">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href={activeMega.href}
                className="font-display text-2xl font-bold hover:text-gold transition-colors"
                onClick={() => setActiveMenu(null)}
              >
                {activeMega.label}
              </Link>
              <Link
                href={activeMega.href}
                className="text-sm font-medium text-gray-text hover:text-black underline underline-offset-2"
                onClick={() => setActiveMenu(null)}
              >
                Ver toda la colección →
              </Link>
            </div>

            {/* Special collections row */}
            {activeMega.navCollections.length > 0 && (
              <div className="mb-5 pb-5 border-b border-gray-light">
                <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-gray-text mb-3">
                  Colecciones especiales
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeMega.navCollections.map((col) => (
                    <Link
                      key={col.slug}
                      href={`/coleccion/${col.slug}`}
                      onClick={() => setActiveMenu(null)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-bg text-black text-xs font-heading font-semibold rounded hover:bg-gold hover:text-white transition-colors"
                    >
                      {col.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Brands row */}
            {activeMega.brands.length > 0 && (
              <div className="mb-5 pb-5 border-b border-gray-light">
                <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-gray-text mb-3">
                  Marcas
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeMega.brands.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={`/marcas/${brand.slug}`}
                      onClick={() => setActiveMenu(null)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-bg text-black text-xs font-heading font-semibold rounded hover:bg-accent hover:text-white transition-colors"
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Category columns + editorial */}
            <div className="grid grid-cols-4 gap-8">
              {activeMega.columns.map((col) => (
                <div key={col.title}>
                  <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-gray-text mb-4">
                    {col.title}
                  </p>
                  <Link
                    href={col.viewAll}
                    className="block text-sm font-semibold mb-3 hover:text-gold transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    Ver todo
                  </Link>
                  <ul className="flex flex-col gap-2.5">
                    {col.items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`${col.basePath}?cat=${item.slug}`}
                          className="text-sm text-gray-text hover:text-black transition-colors"
                          onClick={() => setActiveMenu(null)}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Empty spacers so editorial stays in 4th column */}
              {Array.from({ length: Math.max(0, 3 - activeMega.columns.length) }).map((_, i) => (
                <div key={`spacer-${i}`} />
              ))}

              {/* Editorial banner */}
              <div className="relative overflow-hidden rounded-lg aspect-[3/4]">
                <Image
                  src={activeMega.editorial.image}
                  alt={activeMega.editorial.title}
                  fill
                  unoptimized
                  sizes="(max-width: 1280px) 20vw, 260px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/70 text-[10px] font-heading uppercase tracking-widest mb-1">
                    {activeMega.editorial.subtitle}
                  </p>
                  <p className="text-white font-display text-lg font-bold mb-3 leading-tight">
                    {activeMega.editorial.title}
                  </p>
                  <Link
                    href={activeMega.editorial.href}
                    onClick={() => setActiveMenu(null)}
                    className="inline-block px-4 py-1.5 bg-white text-black text-xs font-heading font-bold rounded hover:bg-gold hover:text-white transition-colors"
                  >
                    {activeMega.editorial.cta}
                  </Link>
                </div>
              </div>
            </div>

            {/* Promo banner — full width strip */}
            <Link
              href={activeMega.promo.href}
              onClick={() => setActiveMenu(null)}
              className="group relative mt-6 flex items-center overflow-hidden rounded-lg h-20 w-full"
            >
              <Image
                src={activeMega.promo.image}
                alt={activeMega.promo.title}
                fill
                unoptimized
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

              <div className="relative z-10 flex items-center justify-between w-full px-6">
                <div className="flex items-center gap-4">
                  <span className="shrink-0 text-[10px] font-heading font-bold uppercase tracking-widest text-black bg-gold px-2.5 py-1 rounded">
                    {activeMega.promo.badge}
                  </span>
                  <div>
                    <p className="text-white font-heading font-bold text-sm leading-tight">
                      {activeMega.promo.title}
                    </p>
                    <p className="text-white/60 text-xs font-body mt-0.5 hidden lg:block">
                      {activeMega.promo.subtitle}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 flex items-center gap-1.5 text-xs font-heading font-bold text-white border border-white/40 rounded px-4 py-1.5 group-hover:bg-white group-hover:text-black transition-colors">
                  {activeMega.promo.cta}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="6" x2="10" y2="6" />
                    <polyline points="7 3 10 6 7 9" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Dark overlay */}
      {activeMega && (
        <div
          className="fixed inset-0 top-[94px] z-20 bg-black/50 transition-opacity duration-300"
          onClick={() => setActiveMenu(null)}
          aria-hidden
        />
      )}
    </>
  )
}
