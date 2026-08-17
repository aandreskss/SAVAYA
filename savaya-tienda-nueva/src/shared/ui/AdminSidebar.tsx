'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export type NavItem = {
  label: string
  href: string
  icon: ReactNode
  permission?: string
  badge?: number
}

export type AdminSidebarProps = {
  navItems: NavItem[]
  userPermissions: string[]
  currentPath: string
  className?: string
  /** Force visible on all screen sizes (used for the mobile overlay). */
  visible?: boolean
}

function SavayaWordmark() {
  return (
    <span className="font-display text-2xl tracking-widest text-accent-gold uppercase select-none">
      SAVAYA
    </span>
  )
}

export function AdminSidebar({
  navItems,
  userPermissions,
  currentPath,
  className,
  visible = false,
}: AdminSidebarProps) {
  const visibleItems = navItems.filter(
    (item) => !item.permission || userPermissions.includes(item.permission),
  )

  return (
    <aside
      aria-label="Navegación del panel de administración"
      className={cn(
        visible ? 'flex' : 'hidden md:flex',
        'flex-col w-64 shrink-0',
        'h-screen sticky top-0 overflow-y-auto',
        'bg-surface border-r border-border',
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <SavayaWordmark />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/'
                ? currentPath === item.href
                : currentPath === item.href || currentPath.startsWith(`${item.href}/`)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'font-sans text-sm font-medium',
                    'transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                    isActive
                      ? 'bg-accent-gold/12 text-accent-gold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/6',
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-gold rounded-r-full"
                    />
                  )}
                  <span aria-hidden="true" className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      aria-label={`${item.badge} pendientes`}
                      className={cn(
                        'inline-flex items-center justify-center',
                        'min-w-[20px] h-5 px-1.5 rounded-full',
                        'font-sans text-xs font-semibold',
                        isActive
                          ? 'bg-accent-gold text-text-primary-inverse'
                          : 'bg-surface-2 text-text-secondary',
                      )}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
