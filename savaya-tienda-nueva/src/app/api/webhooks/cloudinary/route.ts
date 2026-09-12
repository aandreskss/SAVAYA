import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { saveCloudinaryNotification } from '@/domains/integrations/cloudinary/repository'

// Verifies Cloudinary webhook signature.
// Cloudinary computes: SHA1(raw_body + X-Cld-Timestamp + api_secret)
function verifySignature(body: string, signature: string, timestamp: string): boolean {
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret) return false
  const expected = crypto
    .createHash('sha1')
    .update(body + timestamp + apiSecret)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-cld-signature') ?? ''
  const timestamp  = request.headers.get('x-cld-timestamp') ?? ''

  // Reject stale timestamps (> 1 hour) to prevent replay attacks
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > 3600) {
    return NextResponse.json({ error: 'Invalid or expired timestamp' }, { status: 401 })
  }

  // Verify signature when API secret is configured
  if (process.env.CLOUDINARY_API_SECRET) {
    if (!signature || !verifySignature(body, signature, timestamp)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const notificationType = typeof payload.notification_type === 'string'
    ? payload.notification_type
    : 'unknown'

  const resourceType = typeof payload.resource_type === 'string'
    ? payload.resource_type
    : 'image'

  // Extract affected public_ids — structure differs per notification type
  let publicIds: string[] = []
  if (notificationType === 'resource_deleted') {
    const resources = Array.isArray(payload.resources) ? payload.resources : []
    publicIds = resources
      .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map((r) => (typeof r.public_id === 'string' ? r.public_id : ''))
      .filter(Boolean)
  } else if (typeof payload.public_id === 'string') {
    publicIds = [payload.public_id]
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ received: true })
  }

  try {
    await saveCloudinaryNotification({ notificationType, publicIds, resourceType, payload })
  } catch (err) {
    console.error('[webhooks/cloudinary] Failed to save notification:', err)
  }

  return NextResponse.json({ received: true })
}
