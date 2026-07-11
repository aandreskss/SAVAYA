import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Replaces broken image URLs across all products in the DB.
// Usage: GET /api/patch-images?secret=<PATCH_IMAGES_SECRET>
// Disabled in production unless PATCH_IMAGES_ENABLED=true

const REPLACEMENTS: Record<string, string> = {
  // photo-1518611649869-7e9ce4a7d717 — deleted from Unsplash
  'https://images.unsplash.com/photo-1518611649869-7e9ce4a7d717?w=600&h=800&q=80&fit=crop':
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&q=80&fit=crop',
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.PATCH_IMAGES_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }

  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.PATCH_IMAGES_SECRET
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: products, error } = await supabase
    .from('products')
    .select('id, images')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let patched = 0

  for (const product of products ?? []) {
    const original: string[] = product.images ?? []
    const updated = original.map((url: string) => REPLACEMENTS[url] ?? url)
    const changed = updated.some((url: string, i: number) => url !== original[i])

    if (changed) {
      await supabase.from('products').update({ images: updated }).eq('id', product.id)
      patched++
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Patch completado: ${patched} producto(s) actualizado(s).`,
    patched,
  })
}
