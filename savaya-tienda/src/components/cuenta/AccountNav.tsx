'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/cuenta',             label: 'Inicio',        exact: true },
  { href: '/cuenta/pedidos',     label: 'Mis pedidos' },
  { href: '/cuenta/favoritos',   label: 'Favoritos' },
  { href: '/cuenta/perfil',      label: 'Mi perfil' },
  { href: '/cuenta/direcciones', label: 'Direcciones' },
]

export default function AccountNav() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const displayName =
    profile?.name ?? user?.user_metadata?.full_name ?? user?.email ?? 'Mi cuenta'
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden lg:block sticky top-24 self-start">
        {/* User card */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-light">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white font-heading font-bold text-lg shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-gray-text truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive(href, exact)
                  ? 'bg-accent text-white'
                  : 'text-gray-text hover:text-black hover:bg-gray-bg',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => signOut('/')}
          className="mt-6 px-3 py-2 text-sm text-sale hover:opacity-75 transition-opacity text-left w-full"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* ── Mobile tabs ───────────────────────────────────────────────── */}
      <div className="lg:hidden -mx-4 md:-mx-8 px-4 md:px-8 border-b border-gray-light mb-8 overflow-x-auto">
        <nav className="flex min-w-max">
          {NAV.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
                isActive(href, exact)
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-text hover:text-black',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
