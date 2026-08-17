'use server'

import { db } from '@/shared/lib/db'
import { wholesaleLeads } from './schema'
import { WholesaleLeadSchema, type WholesaleLeadInput } from './validators'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { headers } from 'next/headers'
import type { ActionResult } from '@/shared/lib/types'

const SAVAYA_WA = '584141100100'

async function getClientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown'
}

function formatZodErrors(error: import('zod').ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!fieldErrors[field]) fieldErrors[field] = []
    fieldErrors[field].push(issue.message)
  }
  return fieldErrors
}

export async function submitWholesaleLead(
  data: WholesaleLeadInput,
): Promise<ActionResult<{ whatsappUrl: string }>> {
  const parsed = WholesaleLeadSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos inválidos.',
      fieldErrors: formatZodErrors(parsed.error),
    }
  }

  const ip = await getClientIp()
  const rl = await checkRateLimit('register', ip)
  if (!rl.success) {
    return {
      success: false,
      error: 'Demasiadas solicitudes. Intenta de nuevo en una hora.',
    }
  }

  if (process.env.DATABASE_URL) {
    await db.insert(wholesaleLeads).values({
      contactName: parsed.data.contactName,
      businessName: parsed.data.businessName,
      city: parsed.data.city,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email || null,
      estimatedMonthlyVolume: parsed.data.estimatedMonthlyVolume || null,
      message: parsed.data.message || null,
    })
  }

  const waMessage = [
    `Hola SAVAYA, soy ${parsed.data.contactName} de ${parsed.data.businessName} (${parsed.data.city}).`,
    `Me interesa el programa mayorista.`,
    parsed.data.estimatedMonthlyVolume
      ? `Volumen estimado: ${parsed.data.estimatedMonthlyVolume} pares/mes.`
      : '',
    parsed.data.message ? `Mensaje: ${parsed.data.message}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const whatsappUrl = `https://wa.me/${SAVAYA_WA}?text=${encodeURIComponent(waMessage)}`

  return { success: true, data: { whatsappUrl } }
}
