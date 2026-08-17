'use server'

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NewsletterResult =
  | { success: true }
  | { success: false; error: string }

const EmailSchema = z.string().email('Ingresa un correo electrónico válido')

// ---------------------------------------------------------------------------
// Newsletter subscription action
// Phase 5 will connect this to the actual email provider.
// For now it validates the address and returns success.
// ---------------------------------------------------------------------------

export async function subscribeToNewsletter(
  _prevState: NewsletterResult | null,
  formData: FormData,
): Promise<NewsletterResult> {
  const email = formData.get('email')

  const parsed = EmailSchema.safeParse(email)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Correo inválido',
    }
  }

  // TODO Phase 5: integrate with email provider (Resend / WhatsApp notification)
  console.info('[cms/actions] Newsletter subscription (Phase 5 pending):', parsed.data)

  return { success: true }
}
