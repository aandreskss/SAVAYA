import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: verify Mercado Pago webhook signature
  // const body = await request.json()
  void request
  return NextResponse.json({ received: true })
}
