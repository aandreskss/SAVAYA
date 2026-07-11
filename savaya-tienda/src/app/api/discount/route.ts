import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// ─── Mock codes (no Supabase) ─────────────────────────────────────────────────

interface MockCode {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
}

const MOCK_CODES: MockCode[] = [
  { code: 'BIENVENIDO10', type: 'percentage', value: 10, min_purchase: 50_000 },
  { code: 'ENVIOGRATIS',  type: 'fixed',      value: 8_000, min_purchase: 0 },
  { code: 'REMATE20',     type: 'percentage', value: 20, min_purchase: 100_000 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n)
}

function calcDiscount(type: 'percentage' | 'fixed', value: number, subtotal: number): number {
  return type === 'percentage'
    ? Math.round((subtotal * value) / 100)
    : Math.min(value, subtotal)
}

function codeLabel(code: string, type: 'percentage' | 'fixed', value: number): string {
  const desc = type === 'percentage' ? `${value}% de descuento` : `${formatCOP(value)} de descuento`
  return `${code} — ${desc}`
}

// ─── POST /api/discount ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!rateLimit(getClientIp(request), 10, 60_000)) {
    return NextResponse.json({ valid: false, error: 'Demasiadas solicitudes. Intenta en un momento.' }, { status: 429 })
  }

  let body: { code?: unknown; subtotal?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ valid: false, error: 'Solicitud inválida.' }, { status: 400 })
  }

  const code = String(body.code ?? '').toUpperCase().trim()
  const subtotal = Number(body.subtotal ?? 0)

  if (!code) {
    return NextResponse.json({ valid: false, error: 'Ingresa un código de descuento.' })
  }

  // ── Mock mode ──
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const mock = MOCK_CODES.find((c) => c.code === code)
    if (!mock) {
      return NextResponse.json({ valid: false, error: 'Código no válido.' })
    }
    if (mock.min_purchase > 0 && subtotal < mock.min_purchase) {
      return NextResponse.json({
        valid: false,
        error: `Código válido en compras desde ${formatCOP(mock.min_purchase)}.`,
      })
    }
    const discountAmount = calcDiscount(mock.type, mock.value, subtotal)
    return NextResponse.json({
      valid: true,
      label: codeLabel(code, mock.type, mock.value),
      discountAmount,
    })
  }

  // ── Supabase mode ──
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Código no válido.' })
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Este código ha expirado.' })
    }
    if (data.max_uses != null && data.used_count >= data.max_uses) {
      return NextResponse.json({ valid: false, error: 'Este código ya no tiene usos disponibles.' })
    }
    if (data.min_purchase != null && subtotal < data.min_purchase) {
      return NextResponse.json({
        valid: false,
        error: `Código válido en compras desde ${formatCOP(data.min_purchase)}.`,
      })
    }

    const discountAmount = calcDiscount(data.type, data.value, subtotal)
    return NextResponse.json({
      valid: true,
      label: codeLabel(code, data.type, data.value),
      discountAmount,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Error al validar el código. Inténtalo de nuevo.' })
  }
}
