'use server'

import { z } from 'zod'
import { Resend } from 'resend'
import { findSubscriberByEmail, saveSubscriber } from '@/domains/newsletter/repository'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NewsletterResult =
  | { success: true }
  | { success: false; error: string }

const EmailSchema = z.string().email('Ingresa un correo electrónico válido')

// ---------------------------------------------------------------------------
// Newsletter subscription action — saves to DB + Resend Audiences
// ---------------------------------------------------------------------------

export async function subscribeToNewsletter(
  _prevState: NewsletterResult | null,
  formData: FormData,
): Promise<NewsletterResult> {
  const email = formData.get('email')

  const parsed = EmailSchema.safeParse(email)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Correo inválido' }
  }

  const normalizedEmail = parsed.data.toLowerCase()

  try {
    // If DB is unavailable (local dev sin credenciales) skip gracefully
    if (!process.env.DATABASE_URL) {
      console.info('[newsletter] No DATABASE_URL — skipping subscriber save')
      return { success: true }
    }

    // Ya suscrito — success silencioso para no exponer la lista
    const existing = await findSubscriberByEmail(normalizedEmail)
    if (existing) return { success: true }

    // Agregar a Resend Audiences
    let resendContactId: string | undefined
    const apiKey = process.env.RESEND_API_KEY
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (apiKey && audienceId) {
      const resend = new Resend(apiKey)
      const { data } = await resend.contacts.create({
        audienceId,
        email: normalizedEmail,
        unsubscribed: false,
      })
      resendContactId = data?.id ?? undefined
    }

    // Guardar en DB
    await saveSubscriber(normalizedEmail, resendContactId)

    return { success: true }
  } catch (error) {
    console.error('[newsletter] subscribeToNewsletter failed:', error)
    return { success: false, error: 'No pudimos procesar tu suscripción. Inténtalo de nuevo.' }
  }
}
