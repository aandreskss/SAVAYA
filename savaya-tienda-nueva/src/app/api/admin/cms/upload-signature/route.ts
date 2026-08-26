import { NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import crypto from 'crypto'

// GET /api/admin/cms/upload-signature
// Returns a Cloudinary signed upload params for CMS block images.
// Only accessible to admins with cms:write permission.

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('cms:write')) {
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
      folder: 'savaya/cms',
      publicId: `cms-${crypto.randomUUID()}`,
      isDev: true,
    })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'savaya/cms'
  const publicId = `cms-${crypto.randomUUID()}`

  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex')

  return NextResponse.json({ signature, timestamp, cloudName, apiKey, folder, publicId })
}
