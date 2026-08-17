'use client'

import { useEffect } from 'react'
import { useThemeStore, type Theme, type Gender } from './theme-store'

/**
 * Reads persisted theme/gender from localStorage on mount and initializes
 * the Zustand store + DOM data attributes. Renders nothing.
 */
export function ThemeSync() {
  const { setTheme, setGender } = useThemeStore()

  useEffect(() => {
    try {
      const theme = localStorage.getItem('savaya-theme') as Theme | null
      const gender = localStorage.getItem('savaya-gender') as Gender | null
      if (theme === 'light' || theme === 'dark') setTheme(theme)
      if (gender === 'mujer' || gender === 'hombre') setGender(gender)
    } catch { /* localStorage unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
