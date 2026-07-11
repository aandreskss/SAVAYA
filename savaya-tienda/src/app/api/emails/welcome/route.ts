import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendWelcomeEmail, type WelcomeEmailData } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body: WelcomeEmailData = await req.json()

    if (!body.email || !body.customerName) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    // Verificar que el solicitante está autenticado y el email coincide con su sesión
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email?.toLowerCase() !== body.email.toLowerCase()) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    await sendWelcomeEmail(body)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('welcome email error:', err)
    return NextResponse.json({ error: 'Error al enviar el email.' }, { status: 500 })
  }
}
