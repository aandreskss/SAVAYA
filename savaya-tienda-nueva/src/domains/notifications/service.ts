import { Resend } from 'resend'
import { render } from '@react-email/render'
import { OrderConfirmationEmail } from './emails/OrderConfirmation'
import { PaymentApprovedEmail } from './emails/PaymentApproved'
import { PaymentRejectedEmail } from './emails/PaymentRejected'
import { logNotification } from './repository'
import type { OrderNotificationData, WhatsAppLinkOptions } from './types'
import { toWaPhone } from '@/shared/lib/phone'

// Lazy-initialized — does not crash if RESEND_API_KEY is absent in dev
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM_ADDRESS = 'SAVAYA <noreply@savayavzla.com>'

// ---------------------------------------------------------------------------
// Email notifications
// ---------------------------------------------------------------------------

export async function sendOrderConfirmation(
  data: OrderNotificationData & { orderId: string; customerId?: string; hasProof: boolean },
): Promise<void> {
  const resend = getResend()

  if (!resend) {
    console.log(`[notifications] skip order confirmation — no RESEND_API_KEY (order: ${data.orderNumber})`)
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `Tu pedido ${data.orderNumber} fue recibido — SAVAYA`,
      templateId: 'order_confirmation',
      status: 'skipped',
      error: 'RESEND_API_KEY not configured',
      orderId: data.orderId,
      customerId: data.customerId,
    })
    return
  }

  const html = await render(
    OrderConfirmationEmail({
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      totalUsd: data.totalUsd,
      totalBs: data.totalBs,
      items: data.items,
      hasProof: data.hasProof,
    }),
  )

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `Tu pedido ${data.orderNumber} fue recibido — SAVAYA`,
      html,
    })

    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `Tu pedido ${data.orderNumber} fue recibido — SAVAYA`,
      templateId: 'order_confirmation',
      status: 'sent',
      orderId: data.orderId,
      customerId: data.customerId,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `Tu pedido ${data.orderNumber} fue recibido — SAVAYA`,
      templateId: 'order_confirmation',
      status: 'failed',
      error,
      orderId: data.orderId,
      customerId: data.customerId,
    })
    // Don't rethrow — notification failure must never break the order flow
    console.error('[notifications] sendOrderConfirmation failed:', error)
  }
}

export async function sendPaymentApproved(
  data: OrderNotificationData & { orderId: string; customerId?: string },
): Promise<void> {
  const resend = getResend()

  if (!resend) {
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `Pago aprobado — ${data.orderNumber}`,
      templateId: 'payment_approved',
      status: 'skipped',
      error: 'RESEND_API_KEY not configured',
      orderId: data.orderId,
      customerId: data.customerId,
    })
    return
  }

  const html = await render(
    PaymentApprovedEmail({
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      totalUsd: data.totalUsd,
      totalBs: data.totalBs,
    }),
  )

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `✓ Pago aprobado — ${data.orderNumber} · SAVAYA`,
      html,
    })
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `✓ Pago aprobado — ${data.orderNumber}`,
      templateId: 'payment_approved',
      status: 'sent',
      orderId: data.orderId,
      customerId: data.customerId,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `✓ Pago aprobado — ${data.orderNumber}`,
      templateId: 'payment_approved',
      status: 'failed',
      error,
      orderId: data.orderId,
      customerId: data.customerId,
    })
    console.error('[notifications] sendPaymentApproved failed:', error)
  }
}

export async function sendPaymentRejected(
  data: { orderId: string; customerId?: string; orderNumber: string; customerName: string; customerEmail: string; reason: string },
): Promise<void> {
  const resend = getResend()

  if (!resend) {
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `Verificación de pago — ${data.orderNumber}`,
      templateId: 'payment_rejected',
      status: 'skipped',
      error: 'RESEND_API_KEY not configured',
      orderId: data.orderId,
      customerId: data.customerId,
    })
    return
  }

  const html = await render(
    PaymentRejectedEmail({
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      reason: data.reason,
    }),
  )

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `Revisión de pago necesaria — ${data.orderNumber} · SAVAYA`,
      html,
    })
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `Revisión de pago — ${data.orderNumber}`,
      templateId: 'payment_rejected',
      status: 'sent',
      orderId: data.orderId,
      customerId: data.customerId,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    await logNotification({
      type: 'email',
      recipient: data.customerEmail,
      subject: `Revisión de pago — ${data.orderNumber}`,
      templateId: 'payment_rejected',
      status: 'failed',
      error,
      orderId: data.orderId,
      customerId: data.customerId,
    })
    console.error('[notifications] sendPaymentRejected failed:', error)
  }
}

// ---------------------------------------------------------------------------
// WhatsApp link helper
// ---------------------------------------------------------------------------

export function buildWhatsAppOrderLink(options: WhatsAppLinkOptions): string {
  const phone = toWaPhone(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '584141100100')
  const text =
    `¡Hola SAVAYA! Acabo de hacer mi pedido y quiero confirmarlo.\n\n` +
    `📦 Pedido: ${options.orderNumber}\n` +
    `👤 Nombre: ${options.customerName}\n` +
    `💰 Total: $${options.totalUsd.toFixed(2)}\n` +
    `💳 Método de pago: ${options.paymentMethod}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
