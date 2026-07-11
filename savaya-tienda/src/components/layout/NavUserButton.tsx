'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useNavTheme } from './NavThemeContext'
import { cn } from '@/lib/utils'

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3.5" />
      <path d="M2.5 18c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn('transition-transform duration-200', open && 'rotate-180')}
    >
      <polyline points="2 4 6 8 10 4" />
    </svg>
  )
}

export default function NavUserButton() {
  const { user, profile, isLoading, signOut } = useAuth()
  const theme = useNavTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  if (isLoading) {
    return (
      <div className={cn(
        'w-8 h-8 rounded-full animate-pulse',
        theme === 'dark' ? 'bg-white/15' : 'bg-black/10'
      )} />
    )
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          'flex items-center gap-1.5 p-2 transition-colors',
          theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-black/70 hover:text-black'
        )}
        aria-label="Iniciar sesión"
      >
        <IconUser />
      </Link>
    )
  }

  const displayName = profile?.name ?? user.user_metadata?.full_name ?? user.email ?? ''
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Mi cuenta"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 transition-colors py-1.5 px-1',
          theme === 'dark' ? 'text-white/90 hover:text-white' : 'text-black/70 hover:text-black'
        )}
      >
        <span className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-colors shrink-0',
          theme === 'dark' ? 'bg-white/20 hover:bg-white/30' : 'bg-black/10 hover:bg-black/15'
        )}>
          {initial}
        </span>
        <IconChevron open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-light rounded-lg shadow-xl py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-light">
            <p className="text-sm font-semibold truncate text-black">{displayName}</p>
            <p className="text-xs text-gray-text truncate">{user.email}</p>
          </div>

          <DropdownItem href="/cuenta" onClose={() => setOpen(false)}>Mi cuenta</DropdownItem>
          <DropdownItem href="/cuenta/pedidos" onClose={() => setOpen(false)}>Mis pedidos</DropdownItem>
          <DropdownItem href="/cuenta/favoritos" onClose={() => setOpen(false)}>Favoritos</DropdownItem>

          <div className="border-t border-gray-light mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); signOut('/') }}
              className="w-full text-left px-4 py-2 text-sm text-sale hover:bg-gray-bg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownItem({
  href,
  onClose,
  children,
}: {
  href: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="block px-4 py-2 text-sm text-black hover:bg-gray-bg transition-colors"
    >
      {children}
    </Link>
  )
}
