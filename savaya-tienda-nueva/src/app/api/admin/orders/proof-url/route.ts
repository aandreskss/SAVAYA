import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'
import { getPaymentProofById } from '@/domains/admin/orders/repository'

// GET /api/admin/orders/proof-url?proofId=xxx
// Streams a private Cloudinary payment proof through our server so:
// - The browser never receives Cloudinary credentials
// - Access is gated behind admin auth + payments:read permission
// - The asset URL is never exposed to the client

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('payments:read')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const proofId = request.nextUrl.searchParams.get('proofId')
  if (!proofId) return new NextResponse('Bad Request', { status: 400 })

  const proof = await getPaymentProofById(proofId)
  if (!proof?.cloudinaryPublicId) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return new NextResponse('Cloudinary no configurado', { status: 503 })
  }

  // Access a private Cloudinary asset server-to-server using HTTP Basic auth
  // (api_key:api_secret). This never exposes credentials to the browser.
  const deliveryUrl = `https://res.cloudinary.com/${cloudName}/image/private/${proof.cloudinaryPublicId}`
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  let upstream: Response
  try {
    upstream = await fetch(deliveryUrl, {
      headers: { Authorization: `Basic ${credentials}` },
      // no cache — fresh fetch every time (proofs can be updated)
      cache: 'no-store',
    })
  } catch {
    return new NextResponse('Error al obtener el comprobante', { status: 502 })
  }

  if (!upstream.ok) {
    return new NextResponse('Comprobante no encontrado en almacenamiento', { status: 404 })
  }

  const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      // private, no-store: never cached by browser or CDN
      'Cache-Control': 'private, no-store',
      // block embedding in iframes outside our domain
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
