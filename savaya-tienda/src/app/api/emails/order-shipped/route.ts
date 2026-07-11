import { NextRequest, NextResponse } from 'next/server'
import { sendOrderShippedEmail, type OrderShippedData } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    // Solo llamable desde código server-side con el secret interno
    const authHeader = req.headers.get('authorization')
    const internalSecret = process.env.INTERNAL_API_SECRET
    if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const body: OrderShippedData = await req.json()

    if (!body.email || !body.orderNumber || !body.orderId) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    await sendOrderShippedEmail(body)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('order-shipped email error:', err)
    return NextResponse.json({ error: 'Error al enviar el email.' }, { status: 500 })
  }
}
