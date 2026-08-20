'use client'

import Link from 'next/link'
import { useNavStore } from './nav-store'
import { useCartStore } from '@/domains/cart/cart-store'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/shared/lib/utils'

type Props = {
  isLoggedIn: boolean
  /** Passed from server as initial value — store overrides once hydrated */
  cartCount: number
}

export function NavActions({ isLoggedIn, cartCount: cartCountServer }: Props) {
  const { toggleSearch } = useNavStore()
  const { summary, openCart } = useCartStore()

  const cartCount = summary?.itemCount ?? cartCountServer

  return (
    <div className="flex items-center gap-0.5">
      {/* Tema claro/oscuro */}
      <ThemeToggle className="h-9 w-9" />

      {/* Búsqueda */}
      <ActionButton aria-label="Buscar productos" onClick={toggleSearch}>
        <SearchIcon />
      </ActionButton>

      {/* Cuenta — solo desktop */}
      <Link
        href={isLoggedIn ? '/mi-cuenta' : '/iniciar-sesion'}
        aria-label={isLoggedIn ? 'Mi cuenta' : 'Iniciar sesión'}
        className={cn(
          'hidden md:flex h-9 w-9 items-center justify-center rounded-sm',
          'text-text-primary hover:text-accent-gold hover:bg-surface-2',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
        )}
      >
        <PersonIcon />
      </Link>

      {/* Wishlist — lleva directamente a lista de deseos */}
      <Link
        href="/mi-cuenta/wishlist"
        aria-label="Lista de deseos"
        className={cn(
          'hidden md:flex h-9 w-9 items-center justify-center rounded-sm',
          'text-text-primary hover:text-accent-gold hover:bg-surface-2',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
        )}
      >
        <HeartIcon />
      </Link>

      {/* Carrito */}
      <ActionButton
        aria-label={cartCount > 0 ? `Carrito (${cartCount} ítems)` : 'Carrito'}
        onClick={openCart}
      >
        <span className="relative">
          <BagIcon />
          {cartCount > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute -top-1.5 -right-1.5',
                'h-4 min-w-4 px-1 rounded-full',
                'bg-accent-gold text-text-primary-inverse',
                'font-sans text-[10px] font-bold leading-4 text-center',
              )}
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </span>
      </ActionButton>
    </div>
  )
}

function ActionButton({
  children,
  'aria-label': ariaLabel,
  onClick,
  className,
}: {
  children: React.ReactNode
  'aria-label': string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'h-10 w-10 flex items-center justify-center rounded-sm',
        'text-text-primary hover:text-accent-gold hover:bg-surface-2',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
        className,
      )}
    >
      {children}
    </button>
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

function HeartIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 17s-8-5-8-10a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5-8 10-8 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 6.5h10l1.5 10H3.5L5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 18c0-3.866 3.134-6 7-6s7 2.134 7 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

