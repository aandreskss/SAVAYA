import { NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import crypto from 'crypto'

// GET /api/admin/catalog/upload-signature
// Returns a signed Cloudinary upload signature for product images (public folder).
// Only accessible to authenticated admin users with catalog:write permission.

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('catalog:write')) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown'
  const rl = await checkRateLimit('upload', ip)
  if (!rl.success) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({
      signature: 'dev-signature',
      timestamp: Math.floor(Date.now() / 1000),
      cloudName: 'dev-cloud',
      apiKey: 'dev-key',
      folder: 'savaya/products',
      publicId: `product-${crypto.randomUUID()}`,
      isDev: true,
    })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'savaya/products'
  const publicId = `product-${crypto.randomUUID()}`

  // Params to sign (must be sorted alphabetically)
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex')

  return NextResponse.json({ signature, timestamp, cloudName, apiKey, folder, publicId })
}
