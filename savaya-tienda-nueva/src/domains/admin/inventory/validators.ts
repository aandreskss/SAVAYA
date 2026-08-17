import { z } from 'zod'

export const ManualMovementSchema = z.object({
  variantId: z.string().uuid('ID de variante inválido'),
  type: z.enum(['purchase', 'adjustment', 'correction']),
  delta: z
    .number()
    .int('La cantidad debe ser un entero')
    .refine((v) => v !== 0, 'La cantidad no puede ser cero'),
  reason: z
    .string()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(500, 'El motivo no puede superar 500 caracteres'),
})
