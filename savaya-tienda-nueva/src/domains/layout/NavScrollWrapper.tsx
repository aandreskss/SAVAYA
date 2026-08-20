'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/shared/lib/utils'

export function NavScrollWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-surface transition-shadow duration-300',
        'border-b border-border/50',
        scrolled && 'shadow-[0_2px_16px_rgba(0,0,0,0.08)]',
      )}
    >
      {children}
    </header>
  )
}
