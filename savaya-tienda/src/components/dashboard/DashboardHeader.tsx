'use client'

import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

interface DashboardHeaderProps {
  adminName: string
  onMenuClick: () => void
}

export default function DashboardHeader({ adminName, onMenuClick }: DashboardHeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-gray-light flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="lg:hidden p-1 text-gray-text hover:text-black transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="5" x2="20" y2="5" />
            <line x1="2" y1="11" x2="20" y2="11" />
            <line x1="2" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <p className="text-xs text-gray-text font-body hidden sm:block">
          Bienvenido de vuelta,{' '}
          <span className="text-black font-semibold">{adminName}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
          <span className="text-[10px] font-heading font-bold text-white">
            {getInitials(adminName)}
          </span>
        </div>
        <button
          onClick={() => signOut('/')}
          className="text-xs text-gray-text hover:text-black transition-colors font-body flex items-center gap-1.5"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
