'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3">
      <span className="relative shrink-0 w-8 h-8">
        <Image src="/images/savaya-mark.png" alt="" fill className="object-contain" priority />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="font-display text-lg tracking-widest text-accent-gold uppercase select-none leading-none">
          SAVAYA
        </span>
        <span className="font-sans text-[10px] text-text-muted tracking-wide select-none">
          Panel administrativo
        </span>
      </div>
    </div>
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
        'flex-col w-60 shrink-0',
        'h-screen sticky top-0 overflow-y-auto',
        'bg-surface border-r border-border/60',
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-border/60">
        <SidebarLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? currentPath === '/admin'
                : currentPath === item.href || currentPath.startsWith(`${item.href}/`)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                    'font-sans text-sm font-medium',
                    'transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                    isActive
                      ? 'bg-accent-gold text-[#111111]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                  )}
                >
                  <span aria-hidden="true" className="shrink-0 w-4 h-4 flex items-center justify-center">
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
                          ? 'bg-[#111111]/20 text-[#111111]'
                          : 'bg-surface-3 text-text-secondary',
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

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-border/60 pt-3">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl',
            'font-sans text-sm text-text-muted',
            'hover:text-text-primary hover:bg-surface-2',
            'transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          )}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ir a la tienda
        </Link>
      </div>
    </aside>
  )
}
