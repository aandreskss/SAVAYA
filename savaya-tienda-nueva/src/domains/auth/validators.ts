import { z } from 'zod'

// ---------------------------------------------------------------------------
// Auth validators — shared between client and server
// ---------------------------------------------------------------------------

export const RegisterCustomerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(100),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
})

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterCustomerInput = z.infer<typeof RegisterCustomerSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
