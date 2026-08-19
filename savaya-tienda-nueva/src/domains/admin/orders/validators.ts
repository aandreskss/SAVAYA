import { z } from 'zod'

export const ApprovePaymentSchema = z.object({
  proofId: z.string().uuid('ID de comprobante inválido'),
  orderId: z.string().uuid('ID de pedido inválido'),
  orderNumber: z.string().optional(),
})

export const RejectPaymentSchema = z.object({
  proofId: z.string().uuid('ID de comprobante inválido'),
  orderId: z.string().uuid('ID de pedido inválido'),
  reason: z.string().min(5, 'El motivo debe tener al menos 5 caracteres').max(500, 'Máximo 500 caracteres'),
  orderNumber: z.string().optional(),
})

export const TransitionOrderSchema = z.object({
  orderId: z.string().uuid('ID de pedido inválido'),
  toStatus: z.enum([
    'pending_payment',
    'payment_under_review',
    'payment_rejected',
    'paid',
    'preparing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  reason: z.string().max(500).optional(),
  orderNumber: z.string().optional(),
})

export type ApprovePaymentPayload = z.infer<typeof ApprovePaymentSchema>
export type RejectPaymentPayload = z.infer<typeof RejectPaymentSchema>
export type TransitionOrderPayload = z.infer<typeof TransitionOrderSchema>
