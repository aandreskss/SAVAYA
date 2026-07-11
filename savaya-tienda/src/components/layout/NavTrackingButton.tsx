'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNavTheme } from './NavThemeContext'
import { cn } from '@/lib/utils'

function IconPackage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

export default function NavTrackingButton() {
  const [open, setOpen] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const theme = useNavTheme()
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const num = orderNumber.trim().toUpperCase()
    if (!num) return
    router.push(`/rastrear/${encodeURIComponent(num)}`)
    setOpen(false)
    setOrderNumber('')
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Rastrear pedido"
        title="Rastrear pedido"
        aria-expanded={open}
        className={cn(
          'flex items-center p-2 transition-colors',
          theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-black/70 hover:text-black'
        )}
      >
        <IconPackage />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-light rounded-lg shadow-xl p-4 z-50">
          <p className="font-heading font-bold text-sm mb-1 text-black">Rastrear pedido</p>
          <p className="text-xs text-gray-text mb-3">
            Ingresa tu número de pedido para ver el estado sin iniciar sesión.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="TUL-2026-XXXXX"
              className="flex-1 h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors text-black placeholder:text-gray-text"
            />
            <button
              type="submit"
              disabled={!orderNumber.trim()}
              className="h-9 px-3 bg-black text-white text-sm font-heading font-semibold rounded hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buscar
            </button>
          </form>

          <div className="mt-3 pt-3 border-t border-gray-light">
            <Link
              href="/cuenta/pedidos"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-text hover:text-black transition-colors"
            >
              Ver todos mis pedidos →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
