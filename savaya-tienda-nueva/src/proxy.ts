// ---------------------------------------------------------------------------
// Next.js proxy — Auth.js route protection + per-request CSP nonce.
// Runs in Edge runtime: Web APIs only, no Node.js imports.
// CSP with nonce eliminates 'unsafe-inline' and 'unsafe-eval' for scripts.
// The nonce is forwarded via the 'x-nonce' request header so layout.tsx
// and server components can apply it to every inline <script>.
// ---------------------------------------------------------------------------

import NextAuth from 'next-auth'
import { authConfig } from '@/domains/auth/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    // 'unsafe-inline' removed — inline scripts must carry this nonce
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://connect.facebook.net`,
    // style-src keeps 'unsafe-inline': Tailwind v4 injects utility classes at runtime
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.facebook.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.cloudinary.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://pydolarve.org https://ve.dolarapi.com https://graph.facebook.com",
    "media-src 'self' https://res.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

// auth() checks authConfig.callbacks.authorized before invoking this callback.
// Public routes return true from authorized(), so the nonce is always applied.
// Protected routes (admin, mi-cuenta) redirect before the callback runs.
export default auth((req: NextRequest) => {
  const nonce = btoa(globalThis.crypto.randomUUID())

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', buildCSP(nonce))
  return response
})

export const config = {
  // Match all HTML page routes; skip static assets and binary files.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|mp4|pdf)$).*)',
  ],
}
