'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { NavThemeContext, type NavTheme } from './NavThemeContext'
import NavDesktop from './NavDesktop'
import MobileMenu from './MobileMenu'
import SearchBar from './SearchBar'
import NavCartButton from './NavCartButton'
import NavUserButton from './NavUserButton'
import NavWishlistButton from './NavWishlistButton'
import NavTrackingButton from './NavTrackingButton'
import type { NavBanners, NavGenderEntry, NavBrand } from '@/lib/types'

interface NavbarProps {
  disabledCategories?: string[]
  navBanners?: NavBanners
  whatsappNumber?: string
  navCategories?: NavGenderEntry[]
  navBrands?: NavBrand[]
}

export default function Navbar({ disabledCategories = [], navBanners, whatsappNumber, navCategories, navBrands }: NavbarProps) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      const goingDown = y > lastScrollY.current
      setScrolled(y > 60)
      setHidden(goingDown && y > 120)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Light theme only when on homepage after scrolling (white navbar)
  const theme: NavTheme = isHome && scrolled ? 'light' : 'dark'

  const bgClass = isHome && !scrolled
    ? 'bg-black/40'
    : isHome && scrolled
      ? 'bg-white shadow-sm'
      : 'bg-accent'

  return (
    <NavThemeContext.Provider value={theme}>
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-transform duration-300',
          hidden && '-translate-y-full'
        )}
      >
        {/* Announcement bar */}
        <div className="bg-black text-white text-center text-[11px] font-heading font-bold tracking-widest py-1.5 px-4 uppercase">
          🚚 Envío GRATIS por Zoom, Tealca o MRW a todo el país
        </div>

        {/* Nav header */}
        <header className={cn('h-16', bgClass, 'transition-[background-color,box-shadow] duration-300')}>
        <div className="relative px-4 md:px-8 h-full flex items-center">

          {/* Mobile hamburger — left */}
          <div className="md:hidden">
            <MobileMenu disabledCategories={disabledCategories} whatsappNumber={whatsappNumber} navCategories={navCategories} navBrands={navBrands} />
          </div>

          {/* Logo — absolute center on mobile, normal flow on desktop */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto shrink-0"
            aria-label="Savaya — inicio"
          >
            <Image src="/logo.png" alt="Savaya" width={56} height={56} className="h-14 w-14 object-contain" priority />
          </Link>

          {/* Desktop nav — fills center */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavDesktop disabledCategories={disabledCategories} navBanners={navBanners} navCategories={navCategories} navBrands={navBrands} />
          </div>

          {/* Right actions */}
          <div className="ml-auto md:ml-0 flex items-center gap-0.5 shrink-0">
            <SearchBar />
            <span className="text-2xl px-1 select-none" aria-hidden="true">🇻🇪</span>
            <NavTrackingButton />
            <NavWishlistButton />
            <NavUserButton />
            <NavCartButton />
          </div>
        </div>
        </header>
      </div>

      {/* Spacer pushes content below fixed navbar on non-home pages */}
      {!isHome && <div className="h-[94px]" aria-hidden />}
    </NavThemeContext.Provider>
  )
}
