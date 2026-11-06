import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { headers } from 'next/headers'
import crypto from 'crypto'

// POST /api/checkout/upload-signature
// Returns a Cloudinary signed upload signature for the payment proof.
// The file is uploaded directly from the browser to Cloudinary — never passes through our server.

export async function GET() {
  // Rate limit: 20 uploads per hour per IP
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown'
  const rl = await checkRateLimit('upload', ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera antes de volver a intentar.' },
      { status: 429 },
    )
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  // Dev fallback: no Cloudinary configured
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({
      signature: 'dev-signature',
      timestamp: Math.floor(Date.now() / 1000),
      cloudName: 'dev-cloud',
      apiKey: 'dev-key',
      folder: 'savaya/private/payment-proofs',
      publicId: `proof-${crypto.randomUUID()}`,
      isDev: true,
    })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'savaya/private/payment-proofs'
  const publicId = `proof-${crypto.randomUUID()}`

  // Restrict uploads to safe image/document formats and limit to 10 MB.
  // Params MUST be sorted alphabetically before signing.
  const allowedFormats = 'jpg,jpeg,pdf,png,webp'
  const maxBytes = 10 * 1024 * 1024 // 10 MB

  const paramsToSign = [
    `allowed_formats=${allowedFormats}`,
    `folder=${folder}`,
    `max_bytes=${maxBytes}`,
    `public_id=${publicId}`,
    `timestamp=${timestamp}`,
    `type=private`,
  ].join('&')

  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex')

  return NextResponse.json({
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
    publicId,
    allowedFormats,
    maxBytes,
  })
}
