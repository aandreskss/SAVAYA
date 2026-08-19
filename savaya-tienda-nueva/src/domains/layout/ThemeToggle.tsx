'use client'

import { useThemeStore } from './theme-store'
import { cn } from '@/shared/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center justify-center rounded-sm',
        'text-text-primary hover:text-accent-gold hover:bg-surface-2',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
        className,
      )}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M15.78 4.22l-1.06 1.06M5.28 14.72l-1.06 1.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
