import { z } from 'zod'

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
