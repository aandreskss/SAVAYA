'use client'

import { GoogleContextSchema, type GoogleContext } from './google-context'

/** Reading Google IDs must never prevent or indefinitely delay placing an order. */
export async function getGoogleContext(): Promise<GoogleContext | undefined> {
  const measurementId = process.env.NEXT_PUBLIC_GA4_ID
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return

  return new Promise((resolve) => {
    let clientId: unknown
    let sessionId: unknown
    let completed = 0
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      const parsed = GoogleContextSchema.safeParse({
        measurementId, clientId,
        sessionId: sessionId == null ? undefined : String(sessionId),
      })
      resolve(parsed.success ? parsed.data : undefined)
    }
    const timer = setTimeout(finish, 800)
    const receive = () => { if (++completed === 2) finish() }
    try {
      window.gtag!('get', measurementId, 'client_id', (value: unknown) => {
        clientId = value
        receive()
      })
      window.gtag!('get', measurementId, 'session_id', (value: unknown) => {
        sessionId = value
        receive()
      })
    } catch {
      finish()
    }
  })
}
