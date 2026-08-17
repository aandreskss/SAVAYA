import { create } from 'zustand'

type NavStore = {
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  openMobileMenu: () => void
  closeMobileMenu: () => void
  toggleSearch: () => void
  closeSearch: () => void
}

export const useNavStore = create<NavStore>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  closeSearch: () => set({ isSearchOpen: false }),
}))
