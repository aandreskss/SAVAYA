import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { items } = await req.json() as {
    items: Array<{ variantId: string; quantity: number }>
  }

  if (!items?.length) {
    return NextResponse.json({ ok: true })
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const validItems = items
    .filter((i) =>
      UUID_REGEX.test(i.variantId) &&
      Number.isInteger(i.quantity) &&
      i.quantity >= 1 &&
      i.quantity <= 99
    )
    .slice(0, 100)

  if (!validItems.length) {
    return NextResponse.json({ ok: true })
  }

  // Replace any existing server-side cart for this user
  await supabase.from('cart_items').delete().eq('user_id', user.id)

  await supabase.from('cart_items').insert(
    validItems.map((item) => ({
      user_id: user.id,
      variant_id: item.variantId,
      quantity: item.quantity,
    }))
  )

  return NextResponse.json({ ok: true })
}
