import { describe, it, expect, beforeEach } from 'vitest'
import { useNavStore } from '../nav-store'

// Reset store state between tests
beforeEach(() => {
  useNavStore.setState({
    isMobileMenuOpen: false,
    isSearchOpen: false,
  })
})

describe('useNavStore — isMobileMenuOpen', () => {
  it('starts closed', () => {
    expect(useNavStore.getState().isMobileMenuOpen).toBe(false)
  })

  it('openMobileMenu sets isMobileMenuOpen to true', () => {
    useNavStore.getState().openMobileMenu()
    expect(useNavStore.getState().isMobileMenuOpen).toBe(true)
  })

  it('closeMobileMenu sets isMobileMenuOpen to false', () => {
    useNavStore.getState().openMobileMenu()
    useNavStore.getState().closeMobileMenu()
    expect(useNavStore.getState().isMobileMenuOpen).toBe(false)
  })

  it('closeMobileMenu is idempotent when already closed', () => {
    useNavStore.getState().closeMobileMenu()
    expect(useNavStore.getState().isMobileMenuOpen).toBe(false)
  })
})

describe('useNavStore — isSearchOpen', () => {
  it('starts closed', () => {
    expect(useNavStore.getState().isSearchOpen).toBe(false)
  })

  it('toggleSearch opens when closed', () => {
    useNavStore.getState().toggleSearch()
    expect(useNavStore.getState().isSearchOpen).toBe(true)
  })

  it('toggleSearch closes when open', () => {
    useNavStore.getState().toggleSearch()
    useNavStore.getState().toggleSearch()
    expect(useNavStore.getState().isSearchOpen).toBe(false)
  })

  it('closeSearch sets isSearchOpen to false', () => {
    useNavStore.getState().toggleSearch()
    useNavStore.getState().closeSearch()
    expect(useNavStore.getState().isSearchOpen).toBe(false)
  })

  it('closeSearch is idempotent when already closed', () => {
    useNavStore.getState().closeSearch()
    expect(useNavStore.getState().isSearchOpen).toBe(false)
  })
})

describe('useNavStore — independent state', () => {
  it('openMobileMenu does not affect isSearchOpen', () => {
    useNavStore.getState().openMobileMenu()
    expect(useNavStore.getState().isSearchOpen).toBe(false)
  })

  it('toggleSearch does not affect isMobileMenuOpen', () => {
    useNavStore.getState().toggleSearch()
    expect(useNavStore.getState().isMobileMenuOpen).toBe(false)
  })
})
