import { Resend } from 'resend'
import * as React from 'react'
import OrderConfirmationEmail, { type OrderConfirmationProps } from '@/emails/OrderConfirmation'
import OrderShippedEmail, { type OrderShippedProps } from '@/emails/OrderShipped'
import WelcomeEmailTemplate, { type WelcomeEmailProps } from '@/emails/WelcomeEmail'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'
const FROM = `Savaya <${process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY)
}

// ─── Order confirmation ───────────────────────────────────────────────────────

export type OrderConfirmationData = Omit<OrderConfirmationProps, 'appUrl'> & {
  email: string
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  if (!process.env.RESEND_API_KEY) return
  const { email, ...props } = data
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Pedido confirmado ${props.orderNumber} — Savaya`,
    react: React.createElement(OrderConfirmationEmail, { ...props, appUrl: APP_URL }),
  })
}

// ─── Order shipped ────────────────────────────────────────────────────────────

export type OrderShippedData = Omit<OrderShippedProps, 'appUrl'> & {
  email: string
}

export async function sendOrderShippedEmail(data: OrderShippedData) {
  if (!process.env.RESEND_API_KEY) return
  const { email, ...props } = data
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `¡Tu pedido ${props.orderNumber} está en camino! — Savaya`,
    react: React.createElement(OrderShippedEmail, { ...props, appUrl: APP_URL }),
  })
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export type WelcomeEmailData = Omit<WelcomeEmailProps, 'appUrl'> & {
  email: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  if (!process.env.RESEND_API_KEY) return
  const { email, ...props } = data
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `¡Bienvenid@ a Savaya, ${props.customerName.split(' ')[0]}!`,
    react: React.createElement(WelcomeEmailTemplate, { ...props, appUrl: APP_URL }),
  })
}
