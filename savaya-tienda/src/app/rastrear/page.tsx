import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rastrear pedido | Savaya',
  description: 'Consulta el estado de tu pedido con tu número de pedido.',
}

type Props = {
  searchParams: Promise<Record<string, string>>
}

export default async function TrackOrderIndexPage({ searchParams }: Props) {
  const sp = await searchParams
  const numero = sp.n?.trim().toUpperCase()

  if (numero) {
    redirect(`/rastrear/${encodeURIComponent(numero)}`)
  }

  return (
    <div className="min-h-screen bg-gray-bg/40">
      <header className="bg-white border-b border-gray-light">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
          <Link href="/" className="text-xs text-gray-text hover:text-black transition-colors">
            ← Volver a la tienda
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-white border border-gray-light flex items-center justify-center mx-auto mb-5">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="text-gray-text">
              <path d="M9 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
              <polyline points="12 15 12 22" />
              <polyline points="8 22 16 22" />
            </svg>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Rastrear pedido</h1>
          <p className="text-gray-text text-sm">
            Ingresa tu número de pedido para ver el estado y enviar tu comprobante de pago.
          </p>
        </div>

        <div className="bg-white border border-gray-light rounded-lg p-6 md:p-8">
          <form method="GET" action="/rastrear" className="space-y-4">
            <div>
              <label htmlFor="n" className="block text-sm font-heading font-medium text-black mb-1.5">
                Número de pedido
              </label>
              <input
                id="n"
                name="n"
                type="text"
                required
                placeholder="Ej: TUL-2026-00001"
                className="w-full h-11 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors uppercase placeholder:normal-case"
              />
              <p className="text-xs text-gray-text mt-1.5">
                Lo encuentras en el correo de confirmación que te enviamos al comprar.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
            >
              BUSCAR PEDIDO
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-light text-center">
            <p className="text-xs text-gray-text mb-3">¿Tienes una cuenta?</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/login"
                className="px-5 py-2.5 border border-gray-light text-sm font-heading font-semibold rounded hover:border-black transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/cuenta/pedidos"
                className="px-5 py-2.5 border border-gray-light text-sm font-heading font-semibold rounded hover:border-black transition-colors"
              >
                Mis pedidos
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-text mt-6">
          ¿Necesitas ayuda?{' '}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '584141100100'}?text=Hola%2C%20necesito%20ayuda%20con%20mi%20pedido`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline hover:no-underline"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      </main>
    </div>
  )
}
