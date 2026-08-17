import { z } from 'zod'

export const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Ingresa un código').max(50),
  subtotalUsd: z.number().positive(),
  customerId: z.string().uuid().optional(),
})

export const DiscountFormSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(50),
  type: z.enum(['percentage', 'fixed_usd']),
  value: z.number().positive('El valor debe ser mayor a 0'),
  minOrderUsd: z.number().min(0).nullable().optional(),
  maxUsesTotal: z.number().int().positive().nullable().optional(),
  maxUsesPerCustomer: z.number().int().min(1).default(1),
  appliesToType: z
    .enum(['all', 'category', 'product', 'collection', 'customer'])
    .default('all'),
  appliesToId: z.string().uuid().nullable().optional(),
  isFirstOrderOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
})

export type DiscountFormPayload = z.infer<typeof DiscountFormSchema>
