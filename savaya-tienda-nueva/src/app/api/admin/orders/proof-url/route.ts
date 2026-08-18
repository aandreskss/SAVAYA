import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'
import { getPaymentProofById } from '@/domains/admin/orders/repository'
import crypto from 'crypto'

// GET /api/admin/orders/proof-url?proofId=xxx
// Streams a private Cloudinary payment proof through our server so the
// browser never receives Cloudinary credentials and access is gated behind auth.

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

  // Cloudinary private assets require the Admin API download endpoint —
  // res.cloudinary.com delivery URLs don't accept HTTP Basic auth.
  const publicId = proof.cloudinaryPublicId
  const timestamp = Math.floor(Date.now() / 1000)

  // Sign: sorted params + apiSecret (SHA1)
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}&type=private`
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex')

  const downloadUrl = new URL(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/download`,
  )
  downloadUrl.searchParams.set('public_id', publicId)
  downloadUrl.searchParams.set('type', 'private')
  downloadUrl.searchParams.set('timestamp', String(timestamp))
  downloadUrl.searchParams.set('api_key', apiKey)
  downloadUrl.searchParams.set('signature', signature)

  let upstream: Response
  try {
    upstream = await fetch(downloadUrl.toString(), { cache: 'no-store' })
  } catch {
    return new NextResponse('Error al obtener el comprobante', { status: 502 })
  }

  if (!upstream.ok) {
    // If image/download fails it might be a PDF/raw file — retry with raw/download
    try {
      const rawUrl = new URL(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/download`,
      )
      rawUrl.searchParams.set('public_id', publicId)
      rawUrl.searchParams.set('type', 'private')
      rawUrl.searchParams.set('timestamp', String(timestamp))
      rawUrl.searchParams.set('api_key', apiKey)
      rawUrl.searchParams.set('signature', signature)

      const rawUpstream = await fetch(rawUrl.toString(), { cache: 'no-store' })
      if (rawUpstream.ok) {
        const contentType = rawUpstream.headers.get('Content-Type') ?? 'application/octet-stream'
        return new NextResponse(rawUpstream.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'private, no-store',
            'X-Frame-Options': 'SAMEORIGIN',
          },
        })
      }
    } catch {
      // fall through to error below
    }
    return new NextResponse('Comprobante no encontrado en almacenamiento', { status: 404 })
  }

  const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
