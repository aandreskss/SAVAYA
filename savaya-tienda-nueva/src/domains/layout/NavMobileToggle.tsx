'use client'

import { useNavStore } from './nav-store'
import { cn } from '@/shared/lib/utils'

export function NavMobileToggle() {
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useNavStore()

  const toggle = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu()
    } else {
      openMobileMenu()
    }
  }

  return (
    <button
      type="button"
      aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
      aria-expanded={isMobileMenuOpen}
      onClick={toggle}
      className={cn(
        'md:hidden h-10 w-10 flex items-center justify-center rounded-sm',
        'text-text-primary hover:text-accent-gold hover:bg-white/8',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
      )}
    >
      <span aria-hidden="true" className="flex flex-col gap-[5px] w-5">
        <span
          className={cn(
            'block h-[1.5px] bg-current transition-all duration-[200ms] origin-center',
            isMobileMenuOpen ? 'translate-y-[6.5px] rotate-45' : '',
          )}
        />
        <span
          className={cn(
            'block h-[1.5px] bg-current transition-all duration-[200ms]',
            isMobileMenuOpen ? 'opacity-0 scale-x-0' : '',
          )}
        />
        <span
          className={cn(
            'block h-[1.5px] bg-current transition-all duration-[200ms] origin-center',
            isMobileMenuOpen ? '-translate-y-[6.5px] -rotate-45' : '',
          )}
        />
      </span>
    </button>
  )
}
