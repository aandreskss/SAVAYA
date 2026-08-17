import { z } from 'zod'

// ---------------------------------------------------------------------------
// Customer-facing validators — shared between client and server
// ---------------------------------------------------------------------------

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  phone: z
    .string()
    .min(7, 'Mínimo 7 dígitos')
    .max(20)
    .optional()
    .or(z.literal('')),
  whatsapp: z
    .string()
    .min(7, 'Mínimo 7 dígitos')
    .max(20)
    .optional()
    .or(z.literal('')),
})

export const AddressSchema = z.object({
  label: z.string().min(1).max(50).default('casa'),
  recipientName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  state: z.string().min(2, 'Campo requerido').max(50),
  city: z.string().min(2, 'Campo requerido').max(50),
  municipality: z.string().min(2, 'Campo requerido').max(50),
  parish: z.string().max(50).optional().or(z.literal('')),
  address: z
    .string()
    .min(5, 'Describe la dirección con más detalle')
    .max(200),
  reference: z.string().max(200).optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
})

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type AddressInput = z.infer<typeof AddressSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
