import NextAuth from 'next-auth'
import { authConfig } from '@/domains/auth/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://connect.facebook.net`,
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

export default auth((req: NextRequest) => {
  const nonce = btoa(globalThis.crypto.randomUUID())

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', buildCSP(nonce))
  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|mp4|pdf)$).*)',
  ],
}
