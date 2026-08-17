'use client'

// ---------------------------------------------------------------------------
// AnalyticsService — single entry point for all tracking events.
// Components call these functions; this layer decides how to route to
// GA4, Meta Pixel, or any future provider.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export type AnalyticsItem = {
  item_id: string
  item_name: string
  price: number
  quantity: number
  item_category?: string
}

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args)
  }
}

// ---------------------------------------------------------------------------
// Ecommerce events
// ---------------------------------------------------------------------------

export function trackViewItemList(items: AnalyticsItem[], listName: string) {
  gtag('event', 'view_item_list', {
    item_list_name: listName,
    items,
  })
}

export function trackSelectItem(item: AnalyticsItem, listName: string) {
  gtag('event', 'select_item', {
    item_list_name: listName,
    items: [item],
  })
  fbq('track', 'ViewContent', {
    content_ids: [item.item_id],
    content_name: item.item_name,
    value: item.price,
    currency: 'USD',
  })
}

export function trackViewItem(item: AnalyticsItem) {
  gtag('event', 'view_item', { items: [item] })
  fbq('track', 'ViewContent', {
    content_ids: [item.item_id],
    content_name: item.item_name,
    value: item.price,
    currency: 'USD',
    content_type: 'product',
  })
}

export function trackAddToWishlist(item: AnalyticsItem) {
  gtag('event', 'add_to_wishlist', { items: [item] })
  fbq('track', 'AddToWishlist', {
    content_ids: [item.item_id],
    content_name: item.item_name,
    value: item.price,
    currency: 'USD',
  })
}

export function trackAddToCart(item: AnalyticsItem) {
  gtag('event', 'add_to_cart', { items: [item], value: item.price * item.quantity, currency: 'USD' })
  fbq('track', 'AddToCart', {
    content_ids: [item.item_id],
    content_name: item.item_name,
    value: item.price,
    currency: 'USD',
  })
}

export function trackViewCart(items: AnalyticsItem[], value: number) {
  gtag('event', 'view_cart', { items, value, currency: 'USD' })
}

export function trackRemoveFromCart(item: AnalyticsItem) {
  gtag('event', 'remove_from_cart', { items: [item] })
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number) {
  gtag('event', 'begin_checkout', { items, value, currency: 'USD' })
  fbq('track', 'InitiateCheckout', {
    value,
    currency: 'USD',
    num_items: items.reduce((s, i) => s + i.quantity, 0),
  })
}

export function trackAddShippingInfo(items: AnalyticsItem[], value: number, shippingTier: string) {
  gtag('event', 'add_shipping_info', { items, value, currency: 'USD', shipping_tier: shippingTier })
}

export function trackAddPaymentInfo(items: AnalyticsItem[], value: number, paymentType: string) {
  gtag('event', 'add_payment_info', { items, value, currency: 'USD', payment_type: paymentType })
  fbq('track', 'AddPaymentInfo', { value, currency: 'USD' })
}

// purchase is fired server-side via /api/analytics/purchase when order reaches PAID status
// The client-side function below is only used as a fallback if CAPI is unavailable
export function trackPurchaseClient(orderNumber: string, items: AnalyticsItem[], value: number) {
  gtag('event', 'purchase', {
    transaction_id: orderNumber,
    items,
    value,
    currency: 'USD',
  })
  fbq('track', 'Purchase', {
    value,
    currency: 'USD',
    content_ids: items.map((i) => i.item_id),
    num_items: items.reduce((s, i) => s + i.quantity, 0),
  })
}

export function trackSearch(searchTerm: string) {
  gtag('event', 'search', { search_term: searchTerm })
  fbq('track', 'Search', { search_string: searchTerm })
}
