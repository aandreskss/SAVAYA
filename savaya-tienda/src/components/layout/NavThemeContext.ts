'use client'

import { createContext, useContext } from 'react'

export type NavTheme = 'dark' | 'light'

export const NavThemeContext = createContext<NavTheme>('dark')

export function useNavTheme(): NavTheme {
  return useContext(NavThemeContext)
}
