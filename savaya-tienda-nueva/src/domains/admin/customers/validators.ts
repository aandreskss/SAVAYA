import { z } from 'zod'

export const UpdateCustomerSchema = z.object({
  customerId: z.string().uuid('ID inválido'),
  firstName: z.string().min(1, 'Nombre requerido').max(100),
  lastName: z.string().min(1, 'Apellido requerido').max(100),
  email: z.string().email('Email inválido'),
  phone: z.string().max(30).nullish().transform((v) => v ?? null),
  whatsapp: z.string().max(30).nullish().transform((v) => v ?? null),
})
export type UpdateCustomerPayload = z.infer<typeof UpdateCustomerSchema>

export const AddNoteSchema = z.object({
  customerId: z.string().uuid('ID de cliente inválido'),
  content: z
    .string()
    .min(1, 'La nota no puede estar vacía')
    .max(1000, 'Máximo 1000 caracteres'),
})

export const SetTagSchema = z.object({
  customerId: z.string().uuid('ID de cliente inválido'),
  tag: z.enum([
    'new', 'returning', 'vip', 'high_ticket', 'inactive', 'frequent', 'wholesale',
  ]),
  active: z.boolean(),
})

export type AddNotePayload = z.infer<typeof AddNoteSchema>
export type SetTagPayload = z.infer<typeof SetTagSchema>
