'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  roles: UserRole[]
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    roles: ['admin', 'sub_admin', 'editor', 'gestor_pedidos'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/dashboard/productos',
    label: 'Productos',
    roles: ['admin', 'sub_admin', 'editor'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/inventario',
    label: 'Inventario',
    roles: ['admin', 'sub_admin', 'editor'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" y1="13" x2="8" y2="13.01" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="12" y1="13" x2="16" y2="13" strokeLinecap="round" />
        <line x1="8" y1="17" x2="8" y2="17.01" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="12" y1="17" x2="16" y2="17" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/pedidos',
    label: 'Pedidos',
    roles: ['admin', 'sub_admin', 'gestor_pedidos'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/clientes',
    label: 'Clientes',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/dashboard/marketing',
    label: 'Marketing',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/descuentos',
    label: 'Descuentos',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/dashboard/popup',
    label: 'Popup',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6M9 12h4" />
        <path d="M15 16l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/hero',
    label: 'Hero Carrousel',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M8 12h8M12 9v6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/banners',
    label: 'Banners',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 10h2M6 14h8" />
      </svg>
    ),
  },
  {
    href: '/dashboard/colecciones',
    label: 'Colecciones',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/marcas',
    label: 'Marcas',
    roles: ['admin', 'sub_admin', 'editor'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/categorias',
    label: 'Categorías',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    href: '/dashboard/guia-tallas',
    label: 'Guía de tallas',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-4" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="6" rx="1" />
        <path d="M9 12h6M9 16h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/configuracion',
    label: 'Configuración',
    roles: ['admin', 'sub_admin'],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function DashboardSidebar({
  role,
  mobileOpen,
  onClose,
}: {
  role: UserRole
  mobileOpen: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const visibleItems =
    role === 'admin' || role === 'sub_admin'
      ? NAV_ITEMS
      : NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full w-60 bg-accent flex flex-col z-40',
        'transition-transform duration-300',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="relative px-6 py-5 border-b border-white/10">
        <Link href="/" aria-label="Savaya — inicio">
          <Image src="/logo.png" alt="Savaya" width={40} height={40} className="h-10 w-10 object-contain" />
        </Link>
        <p className="text-[11px] text-white/40 mt-0.5 font-body">Panel de administración</p>
        <button
          onClick={onClose}
          aria-label="Cerrar menú"
          className="absolute top-4 right-4 lg:hidden text-white/60 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="17" y2="17" />
            <line x1="17" y1="3" x2="3" y2="17" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ href, label, icon }) => {
          const isActive =
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-body transition-colors',
                isActive
                  ? 'bg-gold/20 text-gold font-semibold'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              )}
            >
              <span className={cn('shrink-0', isActive ? 'text-gold' : 'text-white/40')}>
                {icon}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-[11px] text-white/25 font-body">Savaya v1.0 · Fase 2</p>
      </div>
    </aside>
  )
}
