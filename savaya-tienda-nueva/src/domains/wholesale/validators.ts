import { z } from 'zod'

export const WholesaleLeadSchema = z.object({
  contactName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  businessName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  city: z.string().min(2, 'Campo requerido').max(50),
  whatsapp: z
    .string()
    .min(7, 'Ingresa un número de WhatsApp válido')
    .max(20),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  estimatedMonthlyVolume: z.string().max(100).optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
})

export type WholesaleLeadInput = z.infer<typeof WholesaleLeadSchema>
