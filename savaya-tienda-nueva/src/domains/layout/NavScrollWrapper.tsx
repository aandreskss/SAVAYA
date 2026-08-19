'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/shared/lib/utils'

export function NavScrollWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-surface/98 backdrop-blur-xl border-b border-border shadow-[0_4px_32px_rgba(0,0,0,0.14)]'
          : 'bg-surface/85 backdrop-blur-md border-b border-border/20',
      )}
    >
      {children}
      {/* Thin gold gradient accent — always visible */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent pointer-events-none"
      />
    </header>
  )
}
