import type { Discount } from '@/domains/discounts-promotions/types'

export type { Discount as AdminDiscount }

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }
