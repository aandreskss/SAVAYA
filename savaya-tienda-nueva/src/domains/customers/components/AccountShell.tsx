'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/domains/auth/actions'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: '/mi-cuenta/resumen', label: 'Resumen' },
  { href: '/mi-cuenta/pedidos', label: 'Mis pedidos' },
  { href: '/mi-cuenta/wishlist', label: 'Wishlist' },
  { href: '/mi-cuenta/direcciones', label: 'Mis direcciones' },
  { href: '/mi-cuenta/perfil', label: 'Mi perfil' },
  { href: '/mi-cuenta/seguridad', label: 'Seguridad' },
]

// ---------------------------------------------------------------------------
// AccountShell — sidebar on desktop, tab bar on mobile
// ---------------------------------------------------------------------------

interface Props {
  displayName: string
  email: string
  children: React.ReactNode
}

export function AccountShell({ displayName, email, children }: Props) {
  const pathname = usePathname()

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <p className="text-text-secondary text-sm">Hola,</p>
        <h1 className="font-display text-2xl uppercase tracking-wide">{displayName}</h1>
        <p className="text-text-secondary text-sm">{email}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav aria-label="Menú de cuenta">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/mi-cuenta/resumen' && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-accent-gold text-text-primary-inverse font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
              <li>
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-text-secondary hover:text-error hover:bg-surface transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Mobile tab bar */}
          <div
            className="md:hidden flex overflow-x-auto gap-1 pb-2 mb-6 scrollbar-none border-b border-border"
            role="navigation"
            aria-label="Secciones de cuenta"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/mi-cuenta/resumen' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'shrink-0 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-accent-gold text-text-primary-inverse font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {children}

          {/* Mobile logout */}
          <div className="md:hidden mt-8 pt-4 border-t border-border">
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-text-secondary hover:text-error transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
