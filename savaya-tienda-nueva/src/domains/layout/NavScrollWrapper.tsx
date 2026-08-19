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
          ? 'bg-surface/98 backdrop-blur-xl border-b border-border shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
          : 'bg-surface/80 backdrop-blur-sm border-b border-transparent',
      )}
    >
      {children}
    </header>
  )
}
