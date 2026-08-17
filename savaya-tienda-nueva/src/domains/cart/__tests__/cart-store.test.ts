import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cart-store'
import type { CartSummary } from '../repository'

const EMPTY_SUMMARY: CartSummary = {
  cartId: 'test-cart',
  items: [],
  subtotalUsd: 0,
  itemCount: 0,
  hasUnavailableItems: false,
}

const SUMMARY_WITH_ITEMS: CartSummary = {
  cartId: 'test-cart',
  items: [
    {
      cartItemId: 'item-1',
      variantId: 'var-1',
      productId: 'prod-1',
      productName: 'Sandalia Test',
      productSlug: 'sandalia-test',
      sku: 'TEST-001',
      color: { name: 'Negro', hex: '#1C1C1E' },
      size: { name: '37' },
      quantity: 2,
      unitPriceUsd: 45,
      totalPriceUsd: 90,
      compareAtPrice: null,
      imageUrl: null,
      imageAlt: null,
      availableStock: 5,
      isAvailable: true,
    },
  ],
  subtotalUsd: 90,
  itemCount: 2,
  hasUnavailableItems: false,
}

beforeEach(() => {
  useCartStore.setState({
    isOpen: false,
    summary: null,
  })
})

describe('useCartStore — drawer state', () => {
  it('starts with isOpen = false', () => {
    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('openCart sets isOpen to true', () => {
    useCartStore.getState().openCart()
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('closeCart sets isOpen to false', () => {
    useCartStore.getState().openCart()
    useCartStore.getState().closeCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('closeCart is idempotent when already closed', () => {
    useCartStore.getState().closeCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('toggleCart switches isOpen from false to true', () => {
    useCartStore.getState().toggleCart()
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('toggleCart switches isOpen from true to false', () => {
    useCartStore.getState().openCart()
    useCartStore.getState().toggleCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('toggleCart alternates state on repeated calls', () => {
    useCartStore.getState().toggleCart()
    useCartStore.getState().toggleCart()
    useCartStore.getState().toggleCart()
    expect(useCartStore.getState().isOpen).toBe(true)
  })
})

describe('useCartStore — summary state', () => {
  it('starts with summary = null', () => {
    expect(useCartStore.getState().summary).toBeNull()
  })

  it('setSummary updates the summary', () => {
    useCartStore.getState().setSummary(EMPTY_SUMMARY)
    expect(useCartStore.getState().summary).toEqual(EMPTY_SUMMARY)
  })

  it('setSummary with items updates itemCount', () => {
    useCartStore.getState().setSummary(SUMMARY_WITH_ITEMS)
    expect(useCartStore.getState().summary?.itemCount).toBe(2)
  })

  it('setSummary replaces previous summary', () => {
    useCartStore.getState().setSummary(SUMMARY_WITH_ITEMS)
    useCartStore.getState().setSummary(EMPTY_SUMMARY)
    expect(useCartStore.getState().summary?.itemCount).toBe(0)
  })

  it('drawer state and summary are independent', () => {
    useCartStore.getState().setSummary(SUMMARY_WITH_ITEMS)
    expect(useCartStore.getState().isOpen).toBe(false)

    useCartStore.getState().openCart()
    expect(useCartStore.getState().summary?.itemCount).toBe(2)
  })
})
