import { create } from 'zustand'

export type Theme = 'dark' | 'light'
export type Gender = 'mujer' | 'hombre'

type ThemeStore = {
  theme: Theme
  gender: Gender
  setTheme: (t: Theme) => void
  setGender: (g: Gender) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'light',
  gender: 'mujer',
  setTheme: (theme) => {
    set({ theme })
    try { localStorage.setItem('savaya-theme', theme) } catch { /* SSR guard */ }
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : ''
  },
  setGender: (gender) => {
    set({ gender })
    try { localStorage.setItem('savaya-gender', gender) } catch { /* SSR guard */ }
    document.documentElement.dataset.gender = gender === 'hombre' ? 'hombre' : ''
  },
}))
