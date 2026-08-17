export type DiscountType = 'percentage' | 'fixed_usd'
export type DiscountAppliesToType = 'all' | 'category' | 'product' | 'collection' | 'customer'

export type Discount = {
  id: string
  code: string
  type: DiscountType
  value: number
  minOrderUsd: number | null
  maxUsesTotal: number | null
  maxUsesPerCustomer: number
  usedCount: number
  appliesToType: DiscountAppliesToType
  appliesToId: string | null
  isFirstOrderOnly: boolean
  isActive: boolean
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CouponValidationResult =
  | {
      valid: true
      discountId: string
      discountAmount: number
      type: DiscountType
      value: number
      appliesToType: DiscountAppliesToType
      message: string
    }
  | { valid: false; error: string }

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }
