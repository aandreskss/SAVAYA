'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useThemeStore } from './theme-store'

const MEN_PATH_PREFIXES = ['/hombre']

export function GenderSync() {
  const pathname = usePathname()
  const { setGender } = useThemeStore()

  useEffect(() => {
    const isMen = MEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    setGender(isMen ? 'hombre' : 'mujer')
  }, [pathname, setGender])

  return null
}
