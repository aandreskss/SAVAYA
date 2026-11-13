// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ rawQuery: vi.fn(), after: vi.fn(), deliver: vi.fn() }))
vi.mock('@/shared/lib/db', () => {
  const chain: Record<string, unknown> = {}
  for (const name of ['update', 'set', 'where', 'insert', 'values', 'select', 'from']) {
    chain[name] = vi.fn(() => chain)
  }
  // Awaited mutation chains resolve to an empty result; never contact a database.
  chain.then = (resolve: (value: unknown[]) => void) => resolve([])
  return { db: chain, rawQuery: mocks.rawQuery }
})
vi.mock('next/server', () => ({ after: mocks.after }))
vi.mock('@/domains/analytics/google-purchase', () => ({ deliverGooglePurchase: mocks.deliver }))
vi.mock('@/domains/notifications/service', () => ({ sendPaymentApproved: vi.fn(), sendPaymentRejected: vi.fn() }))
import { approvePayment, transitionOrderStatus, rejectPayment } from '../service'

const actor = { actorId: 'actor', actorEmail: 'admin@example.com', ip: '127.0.0.1' }
beforeEach(() => { vi.clearAllMocks(); mocks.rawQuery.mockReset(); mocks.deliver.mockResolvedValue('sent') })
afterEach(() => vi.restoreAllMocks())

describe('Google purchase is scheduled only after confirming payment', () => {
  it('schedules server delivery when a pending proof is approved', async () => {
    mocks.rawQuery.mockResolvedValueOnce([{ status: 'pending' }]).mockResolvedValueOnce([{ status: 'payment_under_review' }]).mockResolvedValue([])
    await approvePayment('proof', 'order', actor)
    expect(mocks.after).toHaveBeenCalledTimes(1)
    expect(mocks.deliver).not.toHaveBeenCalled()
    await mocks.after.mock.calls[0][0]()
    expect(mocks.deliver).toHaveBeenCalledWith('order')
  })

  it('covers cash/manual transition to paid', async () => {
    mocks.rawQuery.mockResolvedValueOnce([{ status: 'pending_payment' }])
    await transitionOrderStatus('order', 'paid', actor)
    expect(mocks.after).toHaveBeenCalledTimes(1)
  })

  it('does not schedule on payment rejection or shipment', async () => {
    mocks.rawQuery.mockResolvedValueOnce([{ status: 'pending' }]).mockResolvedValueOnce([{ status: 'payment_under_review' }]).mockResolvedValue([])
    await rejectPayment('proof', 'order', 'Invalid proof', actor)
    expect(mocks.after).not.toHaveBeenCalled()
    mocks.rawQuery.mockResolvedValueOnce([{ status: 'preparing' }])
    await transitionOrderStatus('order', 'shipped', actor)
    expect(mocks.after).not.toHaveBeenCalled()
  })

  it('does not schedule an already approved or rejected proof', async () => {
    for (const status of ['approved', 'rejected']) {
      mocks.rawQuery.mockResolvedValueOnce([{ status }])
      await expect(approvePayment('proof', 'order', actor)).rejects.toThrow()
    }
    expect(mocks.after).not.toHaveBeenCalled()
  })
})
