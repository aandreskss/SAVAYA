'use client'

import { useState, useRef, useCallback, useId } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import type { NavCategory } from '@/domains/catalog/nav-config'

type Props = {
  categories: NavCategory[]
}

export function NavDesktop({ categories }: Props) {
  const pathname = usePathname()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uid = useId()

  const openMenu = useCallback((label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenCategory(label)
  }, [])

  const closeMenu = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenCategory(null), 100)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, label: string) => {
      if (e.key === 'Escape') {
        setOpenCategory(null)
        ;(e.currentTarget as HTMLElement).focus()
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpenCategory((prev) => (prev === label ? null : label))
      }
    },
    [],
  )

  return (
    <nav
      aria-label="Menú principal"
      className="hidden md:flex items-center gap-0"
    >
      {categories.map((cat) => {
        const hasSubmenu = Boolean(cat.subcategories?.length)
        const isOpen = openCategory === cat.label
        const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
        const panelId = `${uid}-panel-${cat.label.toLowerCase()}`
        const triggerId = `${uid}-trigger-${cat.label.toLowerCase()}`

        const linkClass = cn(
          'px-3 py-2 rounded-md font-sans text-[13px] font-semibold uppercase tracking-[0.03em] transition-colors duration-150',
          'hover:text-accent-gold hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          isActive ? 'text-text-primary' : 'text-text-secondary',
        )

        if (!hasSubmenu) {
          return (
            <Link key={cat.label} href={cat.href} className={linkClass}>
              {cat.label}
            </Link>
          )
        }

        return (
          <div
            key={cat.label}
            className="relative"
            onMouseEnter={() => openMenu(cat.label)}
            onMouseLeave={closeMenu}
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-haspopup="true"
              onFocus={cancelClose}
              onBlur={closeMenu}
              onKeyDown={(e) => handleKeyDown(e, cat.label)}
              className={cn(linkClass, 'flex items-center gap-1')}
            >
              {cat.label}
              <ChevronIcon open={isOpen} />
            </button>

            {/* Mega menu panel */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              onMouseEnter={cancelClose}
              onMouseLeave={closeMenu}
              className={cn(
                'absolute top-full left-1/2 -translate-x-1/2 mt-1',
                'w-60 bg-surface border border-border rounded-[16px] shadow-lg z-50 p-4',
                'transition-all duration-[150ms] origin-top',
                isOpen
                  ? 'opacity-100 scale-y-100 pointer-events-auto'
                  : 'opacity-0 scale-y-95 pointer-events-none',
              )}
            >
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-3">
                Comprar por categoría
              </p>
              <ul className="flex flex-col gap-1.5">
                {cat.subcategories?.map((sub) => (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      tabIndex={isOpen ? 0 : -1}
                      onClick={() => setOpenCategory(null)}
                      className={cn(
                        'block py-1.5 font-sans text-sm text-text-primary',
                        'hover:text-accent-gold',
                        'transition-colors duration-100',
                        'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-[-2px]',
                      )}
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn(
        'shrink-0 transition-transform duration-[150ms]',
        open && 'rotate-180',
      )}
    >
      <path
        d="M3 4.5l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
