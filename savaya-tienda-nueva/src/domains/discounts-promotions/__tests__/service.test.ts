import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateDiscount } from '../service'

// ---------------------------------------------------------------------------
// calculateDiscount — pure function, no mocking needed
// ---------------------------------------------------------------------------

describe('calculateDiscount()', () => {
  describe('percentage type', () => {
    it('calculates 10% off correctly', () => {
      expect(calculateDiscount('percentage', 10, 100)).toBe(10)
    })

    it('calculates 25% off correctly', () => {
      expect(calculateDiscount('percentage', 25, 80)).toBe(20)
    })

    it('calculates fractional result (floating point)', () => {
      expect(calculateDiscount('percentage', 15, 33)).toBeCloseTo(4.95)
    })

    it('caps discount at 100% of subtotal', () => {
      expect(calculateDiscount('percentage', 100, 50)).toBe(50)
    })

    it('never exceeds subtotal even with >100% value', () => {
      expect(calculateDiscount('percentage', 150, 50)).toBe(50)
    })

    it('returns 0 for 0% discount', () => {
      expect(calculateDiscount('percentage', 0, 100)).toBe(0)
    })
  })

  describe('fixed_usd type', () => {
    it('returns the fixed amount when smaller than subtotal', () => {
      expect(calculateDiscount('fixed_usd', 10, 50)).toBe(10)
    })

    it('caps at subtotal when fixed amount exceeds it', () => {
      expect(calculateDiscount('fixed_usd', 100, 40)).toBe(40)
    })

    it('returns exact subtotal when they are equal', () => {
      expect(calculateDiscount('fixed_usd', 55, 55)).toBe(55)
    })

    it('returns 0 for $0 fixed discount', () => {
      expect(calculateDiscount('fixed_usd', 0, 100)).toBe(0)
    })
  })
})

// ---------------------------------------------------------------------------
// validateCoupon — mocked repository
// ---------------------------------------------------------------------------

vi.mock('../repository', () => ({
  findDiscountByCode: vi.fn(),
  countCustomerUsages: vi.fn(),
  customerHasOrders: vi.fn(),
}))

import { findDiscountByCode, countCustomerUsages, customerHasOrders } from '../repository'
import { validateCoupon } from '../service'
import type { Discount } from '../types'

const baseDiscount: Discount = {
  id: 'disc-1',
  code: 'SAVE10',
  type: 'percentage',
  value: 10,
  minOrderUsd: null,
  maxUsesTotal: null,
  maxUsesPerCustomer: 0,
  usedCount: 0,
  appliesToType: 'all',
  appliesToId: null,
  isFirstOrderOnly: false,
  isActive: true,
  startsAt: null,
  endsAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

describe('validateCoupon()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns error when coupon does not exist', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue(null)
    const result = await validateCoupon('NOTEXIST', 50)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('no existe')
  })

  it('returns error when coupon is inactive', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, isActive: false })
    const result = await validateCoupon('SAVE10', 50)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('activo')
  })

  it('returns error when coupon has not started yet', async () => {
    const future = new Date(Date.now() + 86400_000)
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, startsAt: future })
    const result = await validateCoupon('SAVE10', 50)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('vigente')
  })

  it('returns error when coupon is expired', async () => {
    const past = new Date(Date.now() - 86400_000)
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, endsAt: past })
    const result = await validateCoupon('SAVE10', 50)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('expirado')
  })

  it('returns error when global usage limit is reached', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({
      ...baseDiscount,
      maxUsesTotal: 10,
      usedCount: 10,
    })
    const result = await validateCoupon('SAVE10', 50)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('límite de usos')
  })

  it('returns error when order is below minimum', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, minOrderUsd: 100 })
    const result = await validateCoupon('SAVE10', 50)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('100.00')
  })

  it('returns error when customer exceeded per-customer limit', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, maxUsesPerCustomer: 1 })
    vi.mocked(countCustomerUsages).mockResolvedValue(1)
    const result = await validateCoupon('SAVE10', 50, 'customer-abc')
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('máximo de veces')
  })

  it('returns error when isFirstOrderOnly and customer has prior orders', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, isFirstOrderOnly: true })
    vi.mocked(customerHasOrders).mockResolvedValue(true)
    const result = await validateCoupon('SAVE10', 50, 'customer-abc')
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('primer pedido')
  })

  it('returns valid result with correct discount amount for percentage', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue(baseDiscount)
    const result = await validateCoupon('SAVE10', 100)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.discountAmount).toBe(10)
      expect(result.type).toBe('percentage')
      expect(result.value).toBe(10)
      expect(result.message).toContain('10%')
    }
  })

  it('returns valid result for fixed_usd coupon', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({
      ...baseDiscount,
      type: 'fixed_usd',
      value: 15,
    })
    const result = await validateCoupon('SAVE10', 80)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.discountAmount).toBe(15)
      expect(result.message).toContain('15.00')
    }
  })

  it('skips customer checks when no customerId provided', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({
      ...baseDiscount,
      maxUsesPerCustomer: 1,
      isFirstOrderOnly: true,
    })
    const result = await validateCoupon('SAVE10', 50)
    expect(result.valid).toBe(true)
    expect(countCustomerUsages).not.toHaveBeenCalled()
    expect(customerHasOrders).not.toHaveBeenCalled()
  })

  it('allows coupon when customer is within per-customer limit', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, maxUsesPerCustomer: 3 })
    vi.mocked(countCustomerUsages).mockResolvedValue(2)
    const result = await validateCoupon('SAVE10', 50, 'customer-abc')
    expect(result.valid).toBe(true)
  })

  it('allows isFirstOrderOnly when customer has no prior orders', async () => {
    vi.mocked(findDiscountByCode).mockResolvedValue({ ...baseDiscount, isFirstOrderOnly: true })
    vi.mocked(customerHasOrders).mockResolvedValue(false)
    const result = await validateCoupon('SAVE10', 50, 'customer-new')
    expect(result.valid).toBe(true)
  })
})
