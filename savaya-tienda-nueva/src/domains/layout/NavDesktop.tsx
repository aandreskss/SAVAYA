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
    closeTimer.current = setTimeout(() => setOpenCategory(null), 120)
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
    <nav aria-label="Menú principal" className="hidden md:flex items-center gap-1">
      {categories.map((cat) => {
        const hasSubmenu = Boolean(cat.subcategories?.length)
        const isOpen = openCategory === cat.label
        const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
        const panelId = `${uid}-panel-${cat.label.toLowerCase()}`
        const triggerId = `${uid}-trigger-${cat.label.toLowerCase()}`

        const baseLinkClass = cn(
          'relative group px-3.5 py-2',
          'font-sans text-sm font-medium',
          'transition-colors duration-150',
          'hover:text-accent-gold',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-sm',
          isActive ? 'text-text-primary' : 'text-text-secondary',
        )

        if (!hasSubmenu) {
          return (
            <Link key={cat.label} href={cat.href} className={baseLinkClass}>
              {cat.label}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute bottom-0 left-4 right-4 h-[2px] bg-accent-gold origin-left',
                  'transition-transform duration-200 ease-out',
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                )}
              />
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
              className={cn(baseLinkClass, 'flex items-center gap-1.5')}
            >
              {cat.label}
              <ChevronIcon open={isOpen} />
              <span
                aria-hidden="true"
                className={cn(
                  'absolute bottom-0 left-4 right-4 h-[2px] bg-accent-gold origin-left',
                  'transition-transform duration-200 ease-out',
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                )}
              />
            </button>

            {/* Dropdown panel */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              onMouseEnter={cancelClose}
              onMouseLeave={closeMenu}
              className={cn(
                'absolute top-full left-1/2 -translate-x-1/2 mt-3',
                'w-60 bg-surface border border-border/80 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] z-50 overflow-hidden',
                'transition-all duration-200 origin-top',
                isOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none',
              )}
            >
              <div
                aria-hidden="true"
                className="h-[2px] bg-gradient-to-r from-accent-gold/0 via-accent-gold to-accent-gold/0"
              />
              <div className="p-3">
                <p className="font-display text-[10px] font-bold text-text-secondary uppercase tracking-[0.18em] mb-2 px-2 pt-1">
                  {cat.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {cat.subcategories?.map((sub) => (
                    <li key={sub.href}>
                      <Link
                        href={sub.href}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => setOpenCategory(null)}
                        className={cn(
                          'group/item flex items-center gap-2.5 px-3 py-2 rounded-xl',
                          'font-sans text-sm font-medium text-text-primary',
                          'hover:text-accent-gold hover:bg-accent-gold/6',
                          'transition-all duration-150',
                          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-[-2px]',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="w-1 h-1 rounded-full bg-border/80 group-hover/item:bg-accent-gold transition-colors duration-150 shrink-0"
                        />
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
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
        'shrink-0 transition-transform duration-200',
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
