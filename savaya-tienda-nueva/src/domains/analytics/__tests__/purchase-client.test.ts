import { afterEach, expect, it, vi } from 'vitest'
import { trackPurchaseClient } from '../service'

afterEach(() => { delete window.gtag; delete window.fbq })

it('preserves the existing Meta purchase at checkout without sending a Google purchase', () => {
  window.gtag = vi.fn()
  window.fbq = vi.fn()
  trackPurchaseClient('TEST-001', [{ item_id: 'sku', item_name: 'Product', price: 15, quantity: 2 }], 30)
  expect(window.gtag).not.toHaveBeenCalled()
  expect(window.fbq).toHaveBeenCalledExactlyOnceWith('track', 'Purchase', {
    value: 30, currency: 'USD', content_ids: ['sku'], num_items: 2,
  })
})
