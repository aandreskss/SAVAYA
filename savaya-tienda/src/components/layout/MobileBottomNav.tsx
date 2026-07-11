'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const HIDDEN_PATHS = ['/checkout', '/dashboard', '/carrito']

export default function MobileBottomNav() {
  const pathname = usePathname()
  const items = useCartStore((s) => s.items)
  const openCart = useCartStore((s) => s.openCart)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  const isHome = pathname === '/'
  // SAVAYA: solo categorías de calzado femenino
  const isExplore = ['/casuales', '/deportivos', '/de-vestir', '/mas-vendidos', '/nuevas-colecciones', '/descuentos', '/marcas'].some((p) => pathname.startsWith(p))
  const isSearch = pathname === '/buscar'
  const isAccount = pathname.startsWith('/cuenta')

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-light" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 h-14">
        {/* Inicio */}
        <Link
          href="/"
          className={cn('flex flex-col items-center justify-center gap-0.5 transition-colors', isHome ? 'text-black' : 'text-gray-text hover:text-black')}
        >
          <IconHome />
          <span className="text-[9px] font-heading font-semibold tracking-wide">Inicio</span>
        </Link>

        {/* Explorar */}
        <Link
          href="/mujer"
          className={cn('flex flex-col items-center justify-center gap-0.5 transition-colors', isExplore ? 'text-black' : 'text-gray-text hover:text-black')}
        >
          <IconGrid />
          <span className="text-[9px] font-heading font-semibold tracking-wide">Explorar</span>
        </Link>

        {/* Buscar */}
        <Link
          href="/buscar"
          className={cn('flex flex-col items-center justify-center gap-0.5 transition-colors', isSearch ? 'text-black' : 'text-gray-text hover:text-black')}
        >
          <IconSearch />
          <span className="text-[9px] font-heading font-semibold tracking-wide">Buscar</span>
        </Link>

        {/* Carrito */}
        <button
          onClick={openCart}
          className="flex flex-col items-center justify-center gap-0.5 text-gray-text hover:text-black transition-colors relative"
        >
          <span className="relative">
            <IconCart />
            {totalQty > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            )}
          </span>
          <span className="text-[9px] font-heading font-semibold tracking-wide">Carrito</span>
        </button>

        {/* Cuenta */}
        <Link
          href="/cuenta"
          className={cn('flex flex-col items-center justify-center gap-0.5 transition-colors', isAccount ? 'text-black' : 'text-gray-text hover:text-black')}
        >
          <IconUser />
          <span className="text-[9px] font-heading font-semibold tracking-wide">Cuenta</span>
        </Link>
      </div>
    </nav>
  )
}
