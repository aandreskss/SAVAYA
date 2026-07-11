'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useNavTheme } from './NavThemeContext'
import { cn } from '@/lib/utils'
import type { NavGenderEntry, NavBrand } from '@/lib/types'

type AccordionKey = 'mujer' | 'marcas' | null

// SAVAYA: solo calzado femenino
const ALL_SIMPLE_LINKS = [
  { label: 'Casuales',           href: '/casuales',           categoryKey: 'casuales',           gold: false, sale: false },
  { label: 'Deportivos',         href: '/deportivos',         categoryKey: 'deportivos',         gold: false, sale: false },
  { label: 'De vestir',          href: '/de-vestir',          categoryKey: 'de-vestir',          gold: false, sale: false },
  { label: 'Nuevas colecciones', href: '/nuevas-colecciones', categoryKey: 'nuevas-colecciones', gold: true,  sale: false },
  { label: 'Descuentos',         href: '/descuentos',         categoryKey: 'descuentos',         gold: false, sale: true  },
  { label: 'Más vendidos',       href: '/mas-vendidos',       categoryKey: 'mas-vendidos',       gold: false, sale: false },
]

const ACCOUNT_LINKS = [
  { label: 'Mi cuenta',    href: '/cuenta' },
  { label: 'Mis pedidos',  href: '/cuenta/pedidos' },
  { label: 'Favoritos',    href: '/cuenta/favoritos' },
]

const INFO_LINKS = [
  { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
  { label: 'Contacto',       href: '/contacto' },
  { label: 'FAQ',            href: '/faq' },
]

function IconHamburger() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="5"  x2="20" y2="5"  />
      <line x1="2" y1="11" x2="20" y2="11" />
      <line x1="2" y1="17" x2="20" y2="17" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="17" y2="17" />
      <line x1="17" y1="3" x2="3" y2="17" />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn('transition-transform duration-200', open && 'rotate-180')}
    >
      <polyline points="4 6 8 10 12 6" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8.5" r="5.5" /><line x1="13.5" y1="13.5" x2="18" y2="18" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

interface MobileMenuProps {
  disabledCategories?: string[]
  whatsappNumber?: string
  navCategories?: NavGenderEntry[]
  navBrands?: NavBrand[]
}

export default function MobileMenu({ disabledCategories = [], whatsappNumber, navCategories = [], navBrands = [] }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState<AccordionKey>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const theme = useNavTheme()
  const disabled = new Set(disabledCategories)

  const accordionItems = navCategories.filter((item) => !disabled.has(item.key))
  const simpleLinks = ALL_SIMPLE_LINKS.filter((item) => !disabled.has(item.categoryKey))

  const waNum = whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '573001234567'
  const waHref = `https://wa.me/${waNum}?text=Hola%2C%20tengo%20una%20consulta%20sobre%20mi%20pedido`

  useEffect(() => {
    setIsOpen(false)
    setExpanded(null)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function toggleAccordion(key: AccordionKey) {
    setExpanded((prev) => (prev === key ? null : key))
  }

  function close() {
    setIsOpen(false)
    setSearchQuery('')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/buscar?q=${encodeURIComponent(q)}`)
    close()
  }

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'md:hidden p-1 -mr-1 transition-colors',
          theme === 'dark' ? 'text-white' : 'text-black'
        )}
        aria-label="Abrir menú"
      >
        <IconHamburger />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-accent text-white',
          'flex flex-col transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <Link href="/" onClick={close} aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={48} height={48} className="h-12 w-12 object-contain" />
          </Link>
          <button onClick={close} aria-label="Cerrar menú" className="p-1 -mr-1 text-white/80 hover:text-white">
            <IconClose />
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos…"
              className="w-full h-10 bg-white/15 text-white placeholder:text-white/50 border border-white/25 rounded-lg px-4 pr-10 text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              aria-label="Buscar"
            >
              <IconSearch />
            </button>
          </div>
        </form>

        {/* Nav — scrollable */}
        <nav className="flex-1 overflow-y-auto">
          {/* Accordion categories (dynamic) */}
          {accordionItems.map((item) => {
            const isExpanded = expanded === item.key
            const clothing = item.subcategories.filter((s) => s.product_type === 'clothing')
            const shoes = item.subcategories.filter((s) => s.product_type === 'shoes')
            const accessories = item.subcategories.filter((s) => s.product_type === 'accessories')
            const sections = [
              ...(clothing.length ? [{ title: 'Ropa', basePath: item.href, items: clothing }] : []),
              ...(shoes.length ? [{ title: 'Zapatos', basePath: item.href, items: shoes }] : []),
              ...(accessories.length ? [{ title: 'Accesorios', basePath: item.href, items: accessories }] : []),
            ]
            const itemCollections = item.navCollections ?? []
            const itemBrands = item.brands ?? []
            return (
              <div key={item.key} className="border-b border-white/10">
                <button
                  onClick={() => toggleAccordion(item.key)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between px-5 py-4 font-heading font-semibold text-sm text-left"
                >
                  {item.label}
                  <IconChevron open={isExpanded} />
                </button>

                <div className={cn(
                  'overflow-hidden transition-all duration-300',
                  isExpanded ? 'max-h-[1200px]' : 'max-h-0'
                )}>
                  <div className="bg-white/5 px-5 pb-5">
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block py-3 text-sm font-semibold text-gold border-b border-white/10 mb-4"
                    >
                      Ver toda la colección de {item.label} →
                    </Link>

                    {/* Special collections */}
                    {itemCollections.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                          Colecciones especiales
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {itemCollections.map((col) => (
                            <Link
                              key={col.slug}
                              href={`/coleccion/${col.slug}`}
                              onClick={close}
                              className="inline-flex items-center px-3 py-1 bg-white/15 text-white/80 text-xs font-heading font-semibold rounded hover:bg-gold hover:text-white transition-colors"
                            >
                              {col.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gender brands */}
                    {itemBrands.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                          Marcas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {itemBrands.map((brand) => (
                            <Link
                              key={brand.slug}
                              href={`/marcas/${brand.slug}`}
                              onClick={close}
                              className="inline-flex items-center px-3 py-1 bg-white/15 text-white/80 text-xs font-heading font-semibold rounded hover:bg-gold hover:text-white transition-colors"
                            >
                              {brand.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {sections.length > 0 ? (
                      <div className="grid grid-cols-1 gap-5">
                        {sections.map((section) => (
                          <div key={section.title}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                              {section.title}
                            </p>
                            <ul className="flex flex-col gap-2">
                              {section.items.map((cat) => (
                                <li key={cat.slug}>
                                  <Link
                                    href={`${section.basePath}?cat=${cat.slug}`}
                                    onClick={close}
                                    className="text-sm text-white/75 hover:text-white transition-colors"
                                  >
                                    {cat.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">No hay subcategorías aún</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Simple links */}
          {simpleLinks.map(({ label, href, gold, sale }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                'block px-5 py-4 font-heading font-semibold text-sm border-b border-white/10',
                gold && 'text-gold',
                sale && 'text-sale',
                !gold && !sale && 'text-white/90'
              )}
            >
              {label}
            </Link>
          ))}

          {/* MARCAS accordion — only when there are active brands */}
          {navBrands.length > 0 && (
            <div className="border-b border-white/10">
              <button
                onClick={() => toggleAccordion('marcas')}
                aria-expanded={expanded === 'marcas'}
                className="w-full flex items-center justify-between px-5 py-4 font-heading font-semibold text-sm text-left text-white/90"
              >
                Marcas
                <IconChevron open={expanded === 'marcas'} />
              </button>

              <div className={cn(
                'overflow-hidden transition-all duration-300',
                expanded === 'marcas' ? 'max-h-[500px]' : 'max-h-0'
              )}>
                <div className="bg-white/5 px-5 pb-5">
                  <Link
                    href="/marcas"
                    onClick={close}
                    className="block py-3 text-sm font-semibold text-gold border-b border-white/10 mb-4"
                  >
                    Ver todas las marcas →
                  </Link>
                  <ul className="flex flex-col gap-2">
                    {navBrands.map((brand) => (
                      <li key={brand.slug}>
                        <Link
                          href={`/marcas/${brand.slug}`}
                          onClick={close}
                          className="text-sm text-white/75 hover:text-white transition-colors"
                        >
                          {brand.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Account links */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
              Mi Cuenta
            </p>
            {ACCOUNT_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="block px-5 py-3 text-sm text-white/70 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Institutional links */}
          <div className="pt-4 border-t border-white/10">
            <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
              Información
            </p>
            {INFO_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="block px-5 py-3 text-sm text-white/70 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        {/* WhatsApp CTA */}
        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#25D366] text-white text-sm font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <WhatsAppIcon />
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}
