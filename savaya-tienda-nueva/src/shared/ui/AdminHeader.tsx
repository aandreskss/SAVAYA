'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/shared/lib/utils'

export type AdminHeaderProps = {
  userName: string
  onMenuToggle: () => void
  onLogout: () => void
  className?: string
}

function HamburgerIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

export function AdminHeader({
  userName,
  onMenuToggle,
  onLogout,
  className,
}: AdminHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const initials = getInitials(userName)
  const router = useRouter()

  // Cierre al hacer clic fuera
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
        'flex items-center justify-between h-16 px-4 md:px-6',
        'bg-surface border-b border-border',
        'sticky top-0 z-30',
        className,
      )}
    >
      {/* Left: hamburger (mobile) + wordmark */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={onMenuToggle}
          className={cn(
            'md:hidden flex items-center justify-center w-10 h-10 rounded-lg',
            'text-text-secondary hover:text-text-primary hover:bg-white/8',
            'transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          )}
        >
          <HamburgerIcon />
        </button>

        <span className="font-display font-bold text-lg tracking-widest text-accent-gold uppercase hidden md:block select-none">
          SAVAYA
        </span>
      </div>

      {/* Right: avatar + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          aria-label={`Menú de usuario: ${userName}`}
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-2.5',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-full',
          )}
        >
          {/* Avatar con iniciales */}
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent-gold text-text-primary-inverse font-sans text-sm font-medium select-none"
            aria-hidden="true"
          >
            {initials || <UserIcon />}
          </span>
          <span className="hidden md:block font-sans text-sm font-medium text-text-primary max-w-[140px] truncate">
            {userName}
          </span>
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div
            role="menu"
            aria-label="Opciones de usuario"
            className={cn(
              'absolute right-0 top-full mt-2 w-48 z-50',
              'bg-surface border border-border rounded-md shadow-lg',
              'overflow-hidden',
            )}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsDropdownOpen(false)
                router.push('/admin/perfil')
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3',
                'font-sans text-sm text-text-primary text-left',
                'hover:bg-surface-2 transition-colors duration-100',
                'focus-visible:outline-none focus-visible:bg-surface-2',
              )}
            >
              Mi perfil
            </button>
            <div className="border-t border-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsDropdownOpen(false)
                onLogout()
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3',
                'font-sans text-sm text-error text-left',
                'hover:bg-error/5 transition-colors duration-100',
                'focus-visible:outline-none focus-visible:bg-error/5',
              )}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
