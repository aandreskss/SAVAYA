import { z } from 'zod'

// Only Google identifiers; never customer names, email, phone or payment details.
export const GoogleContextSchema = z.object({
  measurementId: z.string().regex(/^G-[A-Z0-9]+$/),
  clientId: z.string().regex(/^\d+\.\d+$/).max(80),
  sessionId: z.string().regex(/^\d+$/).max(20).optional(),
})

export type GoogleContext = z.infer<typeof GoogleContextSchema>
