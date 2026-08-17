import { z } from 'zod'

export const ZoneFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  type: z.enum(['local_delivery', 'national_agency', 'pickup']),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export const CityFormSchema = z.object({
  zoneId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  state: z.string().min(1, 'El estado es requerido').max(100),
  isActive: z.boolean().default(true),
})

export const MethodFormSchema = z.object({
  zoneId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  provider: z.string().max(100).nullable().optional(),
  estimatedDays: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
})

export const RateFormSchema = z.object({
  methodId: z.string().uuid(),
  cityId: z.string().uuid().nullable().optional(),
  minOrderUsd: z.number().min(0).default(0),
  maxOrderUsd: z.number().positive().nullable().optional(),
  rateUsd: z.number().min(0, 'El costo no puede ser negativo'),
  freeShippingThresholdUsd: z.number().positive().nullable().optional(),
})

export type ZoneFormPayload = z.infer<typeof ZoneFormSchema>
export type CityFormPayload = z.infer<typeof CityFormSchema>
export type MethodFormPayload = z.infer<typeof MethodFormSchema>
export type RateFormPayload = z.infer<typeof RateFormSchema>
