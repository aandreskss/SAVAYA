// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGooglePurchase, type GooglePurchaseOrder } from '../google-purchase-payload'
import { GoogleContextSchema } from '../google-context'

const { rawQuery } = vi.hoisted(() => ({ rawQuery: vi.fn() }))
vi.mock('@/shared/lib/db', () => ({ rawQuery }))
import { deliverGooglePurchase } from '../google-purchase'

const context = { measurementId: 'G-TEST1234', clientId: '123.456', sessionId: '1794580000' }
const order: GooglePurchaseOrder = {
  orderNumber: 'TEST-001', subtotalUsd: 60, discountUsd: 10, shippingUsd: 5, totalUsd: 55,
  items: [
    { id: 'sku-1', name: 'Product 1', price: 20, quantity: 2 },
    { id: 'sku-2', name: 'Product 2', price: 20, quantity: 1 },
  ],
}

describe('Google confirmed-purchase payload', () => {
  it('separates shipping, distributes coupon discount and retains buyer session', () => {
    const body = buildGooglePurchase(order, context, new Date('2026-11-13T12:00:00Z'))
    const params = body.events[0].params
    expect(params.value).toBe(50)
    expect(params.shipping).toBe(5)
    expect(params.transaction_id).toBe('TEST-001')
    expect(params.session_id).toBe(1794580000)
    expect(params.items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toBeCloseTo(50, 5)
    expect(body.timestamp_micros).toBe(new Date('2026-11-13T12:00:00Z').getTime() * 1000)
    expect(Object.keys(body)).toEqual(['client_id', 'timestamp_micros', 'events'])
  })

  it('rejects mismatched totals, invalid quantities and empty products', () => {
    expect(() => buildGooglePurchase({ ...order, totalUsd: 60 }, context, new Date())).toThrow('inconsistent_order_totals')
    expect(() => buildGooglePurchase({ ...order, items: [] }, context, new Date())).toThrow('invalid_items')
    expect(() => buildGooglePurchase({ ...order, items: [{ ...order.items[0], quantity: 0 }] }, context, new Date())).toThrow('invalid_item')
    expect(() => buildGooglePurchase({ ...order, subtotalUsd: 70, totalUsd: 65 }, context, new Date())).toThrow('inconsistent_items')
  })

  it('supports a fully discounted order and no session identifier', () => {
    const body = buildGooglePurchase({ ...order, discountUsd: 60, totalUsd: 5 }, { ...context, sessionId: undefined }, new Date())
    expect(body.events[0].params.value).toBe(0)
    expect(body.events[0].params.items.every((item) => item.price === 0)).toBe(true)
    expect(body.events[0].params).not.toHaveProperty('session_id')
  })

  it('never accepts personal information as a Google identifier', () => {
    expect(GoogleContextSchema.safeParse({ ...context, clientId: 'person@example.com' }).success).toBe(false)
  })
})

describe('Google server delivery', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    rawQuery.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    vi.stubEnv('NEXT_PUBLIC_GA4_ID', context.measurementId)
    vi.stubEnv('GA4_API_SECRET', 'private-test-secret')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks() })

  function mockPurchase() {
    rawQuery
      .mockResolvedValueOnce([{ order_id: 'order-1', context, attempts: 1, occurred_at: new Date() }])
      .mockResolvedValueOnce([{ order_number: 'TEST-001', subtotal_usd: '60', discount_usd: '10', shipping_cost_usd: '5', total_usd: '55' }])
      .mockResolvedValueOnce(order.items.map((item) => ({ id: item.id, product_snapshot: { name: item.name, sku: item.id }, unit_price_usd: String(item.price), quantity: item.quantity })))
      .mockResolvedValue([])
  }

  it('does not send without configuration or from preview deployments', async () => {
    vi.stubEnv('GA4_API_SECRET', '')
    expect(await deliverGooglePurchase('order-1')).toBe('not_configured')
    vi.stubEnv('GA4_API_SECRET', 'test-secret')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(await deliverGooglePurchase('order-1')).toBe('non_production')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(rawQuery).not.toHaveBeenCalled()
  })

  it('does not send pending, rejected, historical, skipped or previously sent orders', async () => {
    rawQuery.mockResolvedValue([]) // no eligible row can be claimed
    expect(await deliverGooglePurchase('order-1')).toBe('not_eligible')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends server purchase once and does not replay on a second approval', async () => {
    mockPurchase()
    fetchMock.mockResolvedValue({ ok: true })
    expect(await deliverGooglePurchase('order-1')).toBe('sent')
    expect(await deliverGooglePurchase('order-1')).toBe('not_eligible')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, request] = fetchMock.mock.calls[0]
    expect(url.origin + url.pathname).toBe('https://www.google-analytics.com/mp/collect')
    expect(url.searchParams.get('api_secret')).toBe('private-test-secret')
    expect(JSON.parse(request.body).events[0].name).toBe('purchase')
  })

  it('keeps a failed HTTP delivery retryable without throwing into approval', async () => {
    mockPurchase()
    fetchMock.mockResolvedValue({ ok: false, status: 503 })
    expect(await deliverGooglePurchase('order-1')).toBe('failed')
    expect(rawQuery).toHaveBeenCalledTimes(4)
    expect(console.error).toHaveBeenCalledWith('[google-purchase]', 'google_http_503')
  })

  it('never backdates a retry beyond Google’s 72-hour window', async () => {
    rawQuery.mockResolvedValueOnce([{ order_id: 'order-1', context, attempts: 2, occurred_at: new Date(Date.now() - 73 * 3600000) }]).mockResolvedValue([])
    expect(await deliverGooglePurchase('order-1')).toBe('failed')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith('[google-purchase]', 'event_expired')
  })

  it('does not send an order to a different Google property', async () => {
    rawQuery.mockResolvedValueOnce([{ order_id: 'order-1', context: { ...context, measurementId: 'G-OTHER123' }, attempts: 1, occurred_at: new Date() }]).mockResolvedValue([])
    expect(await deliverGooglePurchase('order-1')).toBe('failed')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
