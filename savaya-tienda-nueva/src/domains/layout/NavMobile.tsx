'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Drawer } from '@/shared/ui'
import { Accordion } from '@/shared/ui'
import { useNavStore } from './nav-store'
import { GenderSelector } from './GenderSelector'
import { cn } from '@/shared/lib/utils'
import type { NavCategory } from '@/domains/catalog/nav-config'

type Props = {
  categories: NavCategory[]
}

export function NavMobile({ categories }: Props) {
  const pathname = usePathname()
  const { isMobileMenuOpen, closeMobileMenu } = useNavStore()

  // Cierra el drawer cuando el usuario navega
  useEffect(() => {
    closeMobileMenu()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const accordionItems = categories
    .filter((cat) => Boolean(cat.subcategories?.length))
    .map((cat) => ({
      id: cat.label,
      trigger: (
        <span className="font-sans text-sm font-medium text-text-primary">
          {cat.label}
        </span>
      ),
      content: (
        <ul className="flex flex-col gap-0.5 pb-1">
          {cat.subcategories?.map((sub) => (
            <li key={sub.href}>
              <Link
                href={sub.href}
                className={cn(
                  'block py-2 pl-2 font-sans text-sm text-text-secondary',
                  'hover:text-text-primary transition-colors duration-100',
                  'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-sm',
                )}
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      ),
    }))

  const directLinks = categories.filter(
    (cat) => !cat.subcategories?.length,
  )

  return (
    <Drawer
      isOpen={isMobileMenuOpen}
      onClose={closeMobileMenu}
      side="left"
      title="Menú"
    >
      <div className="flex flex-col h-full -mx-6 -my-4">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="font-display text-accent-gold text-xl tracking-widest"
          >
            SAVAYA
          </Link>
        </div>

        {/* Gender selector */}
        <div className="px-6 py-4 border-b border-border">
          <GenderSelector variant="drawer" />
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Categorías con subcategorías → acordeón */}
          {accordionItems.length > 0 && (
            <Accordion items={accordionItems} allowMultiple={false} />
          )}

          {/* Categorías directas */}
          {directLinks.length > 0 && (
            <ul
              className={cn(
                'flex flex-col',
                accordionItems.length > 0 && 'border-t border-border mt-2 pt-2',
              )}
            >
              {directLinks.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className={cn(
                      'block py-4 font-sans text-sm font-medium text-text-primary',
                      'hover:text-accent-gold transition-colors duration-100',
                      'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-sm',
                      pathname === cat.href && 'text-accent-gold',
                    )}
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Links de cuenta al fondo */}
        <div className="px-6 py-5 border-t border-border flex flex-col gap-3">
          <Link
            href="/mi-cuenta/wishlist"
            className={cn(
              'flex items-center gap-3 font-sans text-sm text-text-secondary',
              'hover:text-text-primary transition-colors duration-100',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-sm',
            )}
          >
            <HeartIcon />
            <span>Wishlist</span>
          </Link>
          <Link
            href="/carrito"
            className={cn(
              'flex items-center gap-3 font-sans text-sm text-text-secondary',
              'hover:text-text-primary transition-colors duration-100',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-sm',
            )}
          >
            <BagIcon />
            <span>Carrito</span>
          </Link>
          <Link
            href="/mi-cuenta"
            className={cn(
              'flex items-center gap-3 font-sans text-sm text-text-secondary',
              'hover:text-text-primary transition-colors duration-100',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-sm',
            )}
          >
            <PersonIcon />
            <span>Mi cuenta</span>
          </Link>
        </div>
      </div>
    </Drawer>
  )
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 15.5s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 16 6.5c0 4.5-7 9-7 9Z"
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
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M4.5 5.5h9l1 9h-11l1-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 16c0-3.314 2.686-5 6-5s6 1.686 6 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
