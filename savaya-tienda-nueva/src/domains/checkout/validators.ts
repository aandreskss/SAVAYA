import { z } from 'zod'

// ── Step 1: Personal data ─────────────────────────────────────────────────────

export const PersonalDataSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(80),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(80),
  email: z.string().email('Ingresa un email válido').max(255),
  whatsapp: z
    .string()
    .min(7, 'Ingresa tu número de WhatsApp')
    .max(20)
    .regex(/^[0-9+\s()-]+$/, 'Número inválido'),
})

// ── Step 2: Shipping ──────────────────────────────────────────────────────────

export const ShippingDataSchema = z
  .object({
    zoneId: z.string().uuid('Zona inválida'),
    zoneType: z.enum(['local_delivery', 'national_agency', 'pickup']),
    methodId: z.string().uuid('Método de entrega inválido'),
    cityId: z.string().uuid().optional(),
    recipientName: z.string().min(2, 'El nombre del destinatario es obligatorio').max(120),
    state: z.string().max(80).optional(),
    city: z.string().max(80).optional(),
    municipality: z.string().max(80).optional(),
    parish: z.string().max(80).optional(),
    address: z.string().max(500).optional(),
    reference: z.string().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.zoneType === 'national_agency') {
      if (!data.state) {
        ctx.addIssue({ code: 'custom', path: ['state'], message: 'El estado es obligatorio' })
      }
      if (!data.city) {
        ctx.addIssue({ code: 'custom', path: ['city'], message: 'La ciudad es obligatoria' })
      }
      if (!data.address) {
        ctx.addIssue({ code: 'custom', path: ['address'], message: 'La dirección es obligatoria' })
      }
    }
    if (data.zoneType === 'local_delivery') {
      if (!data.cityId) {
        ctx.addIssue({ code: 'custom', path: ['cityId'], message: 'Selecciona tu municipio' })
      }
      if (!data.address) {
        ctx.addIssue({ code: 'custom', path: ['address'], message: 'La dirección es obligatoria' })
      }
    }
  })

// ── Step 3: Payment ───────────────────────────────────────────────────────────

const PARTIAL_TYPES = ['full', 'partial_20', 'partial_35', 'partial_50'] as const
const PAYMENT_METHOD_TYPES = [
  'zelle',
  'pago_movil',
  'pago_movil_qr',
  'bank_transfer',
  'usdt_trc20',
  'binance_pay',
  'cash',
] as const

export const PaymentDataSchema = z
  .object({
    methodId: z.string().uuid('Método de pago inválido'),
    methodType: z.enum(PAYMENT_METHOD_TYPES),
    methodCurrency: z.enum(['usd', 'ves']),
    partialPaymentType: z.enum(PARTIAL_TYPES),
    reference: z.string().max(120).optional(),
    amountPaid: z.string().optional(),
    paymentDate: z.string().optional(),
    holderName: z.string().max(120).optional(),
    bankName: z.string().max(100).optional(),
    bankPhone: z.string().max(20).optional(),
    clientId: z.string().max(20).optional(),
    transactionHash: z.string().max(200).optional(),
    cloudinaryPublicId: z.string().optional(),
    cloudinaryUrl: z.string().url().optional(),
    proofFileName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.methodType === 'cash') return // cash requires no proof fields

    if (!data.reference || data.reference.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['reference'], message: 'La referencia es obligatoria' })
    }
    if (!data.amountPaid || isNaN(Number(data.amountPaid)) || Number(data.amountPaid) <= 0) {
      ctx.addIssue({ code: 'custom', path: ['amountPaid'], message: 'Ingresa el monto pagado' })
    }
    if (!data.paymentDate) {
      ctx.addIssue({ code: 'custom', path: ['paymentDate'], message: 'La fecha de pago es obligatoria' })
    }
    if (!data.holderName || data.holderName.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['holderName'], message: 'El titular es obligatorio' })
    }
    if (!data.cloudinaryPublicId) {
      ctx.addIssue({
        code: 'custom',
        path: ['cloudinaryPublicId'],
        message: 'Debes subir el comprobante de pago',
      })
    }

    if (data.methodType === 'pago_movil') {
      if (!data.bankName) {
        ctx.addIssue({ code: 'custom', path: ['bankName'], message: 'El banco es obligatorio' })
      }
      if (!data.bankPhone) {
        ctx.addIssue({ code: 'custom', path: ['bankPhone'], message: 'El teléfono es obligatorio' })
      }
      if (!data.clientId) {
        ctx.addIssue({ code: 'custom', path: ['clientId'], message: 'La cédula es obligatoria' })
      }
    }

    if (data.methodType === 'bank_transfer') {
      if (!data.bankName) {
        ctx.addIssue({ code: 'custom', path: ['bankName'], message: 'El banco es obligatorio' })
      }
    }

    if (data.methodType === 'usdt_trc20') {
      if (!data.transactionHash) {
        ctx.addIssue({ code: 'custom', path: ['transactionHash'], message: 'El hash de transacción es obligatorio' })
      }
    }
  })

// ── Full order creation payload (client sends this — no cartId, server reads cookie) ──

export const CreateOrderSchema = z.object({
  personalData: PersonalDataSchema,
  shippingData: ShippingDataSchema,
  paymentData: PaymentDataSchema,
  shippingCostUsd: z.number().min(0),
  exchangeRate: z.number().positive(),
  idempotencyKey: z.string().uuid(),
  couponCode: z.string().max(50).optional(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

// Internal type used inside service (cartId resolved server-side from HttpOnly cookie)
export type CreateOrderServiceInput = CreateOrderInput & { cartId: string }
