'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/domains/layout/ThemeToggle'
import { cn } from '@/shared/lib/utils'

export type AdminHeaderProps = {
  userName: string
  onMenuToggle: () => void
  onLogout: () => void
  className?: string
}

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Inicio',
  '/admin/pedidos': 'Pedidos',
  '/admin/pagos': 'Pagos',
  '/admin/productos': 'Productos',
  '/admin/inventario': 'Inventario',
  '/admin/categorias': 'Categorías',
  '/admin/clientes': 'Clientes',
  '/admin/contenido': 'Editor de página',
  '/admin/promociones': 'Promociones',
  '/admin/delivery': 'Delivery',
  '/admin/tasas': 'Tasas de cambio',
  '/admin/metodos-pago': 'Métodos de pago',
  '/admin/analytics': 'Analytics',
  '/admin/usuarios': 'Usuarios',
  '/admin/configuracion': 'Configuración',
}

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = Object.entries(PAGE_TITLES).find(
    ([key]) => key !== '/admin' && pathname.startsWith(key + '/'),
  )
  return match?.[1] ?? 'Panel'
}

function HamburgerIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2a5.5 5.5 0 0 0-5.5 5.5v2.25L2 12h14l-1.5-2.25V7.5A5.5 5.5 0 0 0 9 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M7 12v.5a2 2 0 0 0 4 0V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AdminHeader({ userName, onMenuToggle, onLogout, className }: AdminHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const initials = getInitials(userName)
  const router = useRouter()
  const pageTitle = resolvePageTitle(pathname)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-6',
        'bg-surface border-b border-border/60',
        'sticky top-0 z-30',
        className,
      )}
    >
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={onMenuToggle}
          className={cn(
            'md:hidden flex items-center justify-center w-9 h-9 rounded-lg',
            'text-text-secondary hover:text-text-primary hover:bg-surface-2',
            'transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          )}
        >
          <HamburgerIcon />
        </button>
        <h1 className="font-sans text-base font-semibold text-text-primary">
          {pageTitle}
        </h1>
      </div>

      {/* Right: bell + theme toggle + avatar */}
      <div className="flex items-center gap-1">
        {/* Bell — decorativo por ahora */}
        <button
          type="button"
          aria-label="Notificaciones"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg',
            'text-text-secondary hover:text-text-primary hover:bg-surface-2',
            'transition-colors duration-150',
          )}
        >
          <BellIcon />
        </button>

        <ThemeToggle className="w-9 h-9 rounded-lg" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label={`Menú de usuario: ${userName}`}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-full ml-1"
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-gold text-[#111111] font-sans text-sm font-semibold select-none"
              aria-hidden="true"
            >
              {initials || <UserIcon />}
            </span>
          </button>

          {isDropdownOpen && (
            <div
              role="menu"
              aria-label="Opciones de usuario"
              className={cn(
                'absolute right-0 top-full mt-2 w-44 z-50',
                'bg-surface border border-border rounded-xl shadow-lg',
                'overflow-hidden',
              )}
            >
              <div className="px-3 py-2.5 border-b border-border">
                <p className="font-sans text-xs font-medium text-text-primary truncate">{userName}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setIsDropdownOpen(false); router.push('/admin/perfil') }}
                className={cn(
                  'w-full flex items-center px-3 py-2.5',
                  'font-sans text-sm text-text-secondary text-left',
                  'hover:text-text-primary hover:bg-surface-2 transition-colors duration-100',
                )}
              >
                Mi perfil
              </button>
              <div className="border-t border-border" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { setIsDropdownOpen(false); onLogout() }}
                className={cn(
                  'w-full flex items-center px-3 py-2.5',
                  'font-sans text-sm text-error text-left',
                  'hover:bg-error/5 transition-colors duration-100',
                )}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
