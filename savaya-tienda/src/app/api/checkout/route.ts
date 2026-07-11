import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

interface CheckoutItem {
  variantId: string
  productId: string
  name: string
  size: string
  color: string
  quantity: number
  unitPrice: number
  imageUrl: string
}

interface CheckoutBody {
  items: CheckoutItem[]
  shippingAddress: {
    name: string
    email: string
    phone: string
    address_line: string
    city: string
    department: string
    postal_code?: string
    notes?: string
    delivery_type?: string
    shipping_company?: string
    office?: string
    state?: string
  }
  shippingMethod: string
  shippingCost: number
  subtotal: number
  discountCode: string | null
  discountAmount: number
  total: number
  paymentMethod: string
  divisaTotal?: number | null
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `TUL-${year}-${rand}`
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 5, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un momento.' }, { status: 429 })
  }

  try {
    const body: CheckoutBody = await req.json()
    const { items, shippingAddress, shippingCost, subtotal, discountAmount, total, paymentMethod, discountCode, divisaTotal } = body

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!items?.length || items.length > 100 || !shippingAddress?.email || !EMAIL_REGEX.test(shippingAddress.email)) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    // ── Mock mode (no Supabase configured) ──────────────────────────────────
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const orderId = randomUUID()
      const orderNumber = generateOrderNumber()
      const params = new URLSearchParams({
        n: orderNumber,
        total: String(total),
        name: shippingAddress.name,
        email: shippingAddress.email,
        method: paymentMethod,
      })
      return NextResponse.json({
        orderId,
        orderNumber,
        redirectUrl: `/pedido/${orderId}?${params.toString()}`,
      })
    }

    // ── Real mode ────────────────────────────────────────────────────────────
    const { createAdminClient } = await import('@/lib/supabase/server')
    const admin = await createAdminClient()

    // ── 1. Validate product prices from DB (prevents client-side price manipulation) ──
    const variantIds = items.map((i) => i.variantId)
    const [{ data: variantRows, error: variantError }, { data: settingsRow }] = await Promise.all([
      admin
        .from('product_variants')
        .select('id, products!inner(id, base_price, sale_price, wholesale_price, is_active)')
        .in('id', variantIds),
      admin.from('store_settings').select('wholesale_min_qty').eq('id', 'main').single(),
    ])

    if (variantError || !variantRows?.length) {
      return NextResponse.json({ error: 'No se pudieron verificar los productos.' }, { status: 400 })
    }

    type VariantRow = { id: string; products: { id: string; base_price: number; sale_price: number | null; wholesale_price: number | null; is_active: boolean } }
    const priceMap = new Map<string, number>()
    const wholesalePriceMap = new Map<string, number | null>()
    for (const row of variantRows as unknown as VariantRow[]) {
      if (!row.products.is_active) {
        return NextResponse.json({ error: 'Uno o más productos no están disponibles.' }, { status: 400 })
      }
      priceMap.set(row.id, row.products.sale_price ?? row.products.base_price)
      wholesalePriceMap.set(row.id, row.products.wholesale_price ?? null)
    }

    const totalCartQty = items.reduce((s, i) => s + i.quantity, 0)
    const wholesaleMinQty: number = (settingsRow as { wholesale_min_qty?: number | null } | null)?.wholesale_min_qty ?? 6

    let serverSubtotal = 0
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: 'Cantidad inválida.' }, { status: 400 })
      }
      const realPrice = priceMap.get(item.variantId)
      if (realPrice === undefined) {
        return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 400 })
      }
      const wholesalePrice = wholesalePriceMap.get(item.variantId) ?? null
      const effectivePrice = wholesalePrice != null && totalCartQty >= wholesaleMinQty
        ? wholesalePrice
        : realPrice
      serverSubtotal += effectivePrice * item.quantity
    }

    // ── 2. Re-validate discount code from DB ──────────────────────────────────
    let serverDiscountAmount = 0
    let validatedCode: { used_count: number; max_uses: number | null } | null = null
    if (discountCode) {
      const { data: codeData } = await admin
        .from('discount_codes')
        .select('type, value, min_purchase, max_uses, used_count, is_active, expires_at')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (codeData) {
        const expired = codeData.expires_at && new Date(codeData.expires_at) < new Date()
        const exhausted = codeData.max_uses != null && codeData.used_count >= codeData.max_uses
        const belowMin = codeData.min_purchase != null && serverSubtotal < codeData.min_purchase
        if (!expired && !exhausted && !belowMin) {
          serverDiscountAmount = codeData.type === 'percentage'
            ? Math.round((serverSubtotal * codeData.value) / 100)
            : Math.min(codeData.value, serverSubtotal)
          validatedCode = { used_count: codeData.used_count, max_uses: codeData.max_uses }
        }
      }
    }

    // ── 3. Recalculate total server-side ──────────────────────────────────────
    const validatedShippingCost = Math.max(0, Number(shippingCost) || 0)
    const serverTotal = Math.max(0, serverSubtotal - serverDiscountAmount + validatedShippingCost)

    const orderId = randomUUID()
    const orderNumber = generateOrderNumber()

    // Insert order using server-calculated values — never trust client prices
    const { error: orderError } = await admin.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      email: shippingAddress.email,
      status: 'pending',
      subtotal: serverSubtotal,
      shipping_cost: validatedShippingCost,
      discount: serverDiscountAmount,
      total: serverTotal,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      divisa_total: divisaTotal ?? null,
    })

    if (orderError) {
      console.error('Order insert error:', orderError)
      return NextResponse.json({ error: 'No se pudo crear el pedido.' }, { status: 500 })
    }

    // Insert order items using DB prices (wholesale if applicable), decrement stock
    for (const item of items) {
      const realPrice = priceMap.get(item.variantId)!
      const wholesalePrice = wholesalePriceMap.get(item.variantId) ?? null
      const effectivePrice = wholesalePrice != null && totalCartQty >= wholesaleMinQty
        ? wholesalePrice
        : realPrice
      await admin.from('order_items').insert({
        order_id: orderId,
        variant_id: item.variantId,
        product_name: item.name,
        variant_info: `Talla ${item.size} - Color ${item.color}`,
        quantity: item.quantity,
        unit_price: effectivePrice,
        image_url: item.imageUrl || null,
      })

      // Decrement stock only when it's sufficient (prevents overselling)
      await admin.rpc('decrement_stock', {
        p_variant_id: item.variantId,
        p_quantity: item.quantity,
      })
    }

    // Increment discount code usage (atomic — prevents race condition on max_uses codes)
    if (discountCode && serverDiscountAmount > 0 && validatedCode) {
      if (validatedCode.max_uses != null) {
        // Optimistic lock: only succeeds if used_count hasn't changed since we read it
        const { data: updated } = await admin
          .from('discount_codes')
          .update({ used_count: validatedCode.used_count + 1 })
          .eq('code', discountCode.toUpperCase())
          .eq('used_count', validatedCode.used_count)
          .select('id')
        if (!updated?.length) {
          console.warn('[checkout] discount race condition detected for code:', discountCode)
        }
      } else {
        await admin.rpc('increment_discount_usage', { p_code: discountCode }).maybeSingle()
      }
    }

    // ── Mercado Pago preference ──────────────────────────────────────────────
    if (paymentMethod === 'mercadopago' && process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      try {
        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            items: items.map((i) => ({
              id: i.variantId,
              title: `${i.name} — Talla ${i.size} ${i.color}`,
              quantity: i.quantity,
              unit_price: i.unitPrice / 100,
              currency_id: 'COP',
            })),
            payer: { name: shippingAddress.name, email: shippingAddress.email },
            back_urls: {
              success: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pedido/${orderId}`,
              failure: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/checkout`,
              pending: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pedido/${orderId}`,
            },
            auto_return: 'approved',
            external_reference: orderNumber,
          }),
        })

        if (mpRes.ok) {
          const mpData: { init_point?: string } = await mpRes.json()
          if (mpData.init_point) {
            return NextResponse.json({ orderId, orderNumber, redirectUrl: mpData.init_point })
          }
        }
      } catch (mpErr) {
        console.error('MP preference error:', mpErr)
      }
    }

    // ── Order confirmation email ──────────────────────────────────────────────
    void sendOrderConfirmationEmail({
      email: shippingAddress.email,
      customerName: shippingAddress.name,
      orderNumber,
      orderId,
      items: items.map((i) => {
        const rp = priceMap.get(i.variantId) ?? i.unitPrice
        const wp = wholesalePriceMap.get(i.variantId) ?? null
        return {
          name: i.name,
          variantInfo: `Talla ${i.size} - Color ${i.color}`,
          quantity: i.quantity,
          unitPrice: wp != null && totalCartQty >= wholesaleMinQty ? wp : rp,
          imageUrl: i.imageUrl || null,
        }
      }),
      subtotal: serverSubtotal,
      shippingCost: validatedShippingCost,
      discount: serverDiscountAmount,
      total: serverTotal,
      shippingAddress: {
        name: shippingAddress.name,
        address_line: shippingAddress.address_line,
        city: shippingAddress.city,
        department: shippingAddress.department,
        phone: shippingAddress.phone,
      },
      paymentMethod,
      shippingMethod: body.shippingMethod,
    }).catch((err) => console.error('Confirmation email error:', err))

    const params = new URLSearchParams({ n: orderNumber, total: String(serverTotal), name: shippingAddress.name })
    return NextResponse.json({
      orderId,
      orderNumber,
      redirectUrl: `/pedido/${orderId}?${params.toString()}`,
    })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
