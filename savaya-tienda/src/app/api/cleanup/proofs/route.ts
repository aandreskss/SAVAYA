import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PROOF_FOLDERS = ['savaya/comprobantes', 'savaya/envios']
const TTL_MS = 72 * 60 * 60 * 1000 // 72 hours

type CloudinaryResource = {
  public_id: string
  secure_url: string
  created_at: string
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 })
  }

  const auth = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
  const cutoff = Date.now() - TTL_MS
  const toDelete: CloudinaryResource[] = []

  // Collect resources older than 72 h from all proof folders
  for (const folder of PROOF_FOLDERS) {
    let nextCursor: string | undefined

    do {
      const params = new URLSearchParams({ type: 'upload', prefix: folder, max_results: '500' })
      if (nextCursor) params.set('next_cursor', nextCursor)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params}`,
        { headers: { Authorization: auth } },
      )
      if (!res.ok) break

      const body = await res.json() as { resources: CloudinaryResource[]; next_cursor?: string }
      nextCursor = body.next_cursor

      for (const r of body.resources) {
        if (new Date(r.created_at).getTime() < cutoff) toDelete.push(r)
      }
    } while (nextCursor)
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ deleted: 0 })
  }

  const deletedUrls: string[] = []

  // Delete from Cloudinary in batches of 100 (API limit)
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100)
    const qs = batch.map(r => `public_ids[]=${encodeURIComponent(r.public_id)}`).join('&')

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${qs}`,
      { method: 'DELETE', headers: { Authorization: auth } },
    )
    if (res.ok) deletedUrls.push(...batch.map(r => r.secure_url))
  }

  // Nullify proof URLs in Supabase so the admin panel doesn't show broken links
  if (deletedUrls.length > 0) {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()

    for (let i = 0; i < deletedUrls.length; i += 100) {
      const batch = deletedUrls.slice(i, i + 100)
      await Promise.all([
        supabase.from('orders').update({ payment_proof_url: null }).in('payment_proof_url', batch),
        supabase.from('orders').update({ shipping_proof_url: null }).in('shipping_proof_url', batch),
      ])
    }
  }

  return NextResponse.json({ deleted: deletedUrls.length })
}
