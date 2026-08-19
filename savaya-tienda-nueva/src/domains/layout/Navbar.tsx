import Link from 'next/link'
import { NAV_CATEGORIES } from '@/domains/catalog/nav-config'
import { NavDesktop } from './NavDesktop'
import { NavMobile } from './NavMobile'
import { NavActions } from './NavActions'
import { NavMobileToggle } from './NavMobileToggle'
import { NavScrollWrapper } from './NavScrollWrapper'
import { SavayaLogo } from './SavayaLogo'

export async function Navbar() {
  const isLoggedIn = false
  const cartCount = 0

  return (
    <NavScrollWrapper>
      <nav
        aria-label="Navegación principal"
        className="max-w-screen-xl mx-auto px-6 md:px-10 h-[80px] flex items-center gap-4"
      >
        {/* Hamburger — mobile only */}
        <NavMobileToggle />

        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 opacity-100 hover:opacity-80 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-sm"
          aria-label="SAVAYA — Inicio"
        >
          <SavayaLogo variant="full" />
        </Link>

        {/* Menú desktop — centrado */}
        <div className="flex-1 flex justify-center">
          <NavDesktop categories={NAV_CATEGORIES} />
        </div>

        {/* Acciones */}
        <NavActions isLoggedIn={isLoggedIn} cartCount={cartCount} />
      </nav>

      {/* Menú mobile */}
      <NavMobile categories={NAV_CATEGORIES} />
    </NavScrollWrapper>
  )
}
