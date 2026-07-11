import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
}

const POPULAR_LINKS = [
  { label: 'Mujer', href: '/mujer' },
  { label: 'Hombre', href: '/hombre' },
  { label: 'Niños', href: '/ninos' },
  { label: 'Zapatos', href: '/zapatos' },
  { label: 'Nuevas colecciones', href: '/nuevas-colecciones' },
  { label: 'Descuentos', href: '/descuentos' },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center">
          <Link href="/" aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          {/* 404 number */}
          <p className="font-display text-[120px] md:text-[160px] font-bold leading-none text-gray-100 select-none">
            404
          </p>

          <div className="-mt-6 md:-mt-10 relative z-10">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#111111] mb-3">
              Página no encontrada
            </h1>
            <p className="text-[#888888] text-sm md:text-base mb-8 leading-relaxed">
              La página que buscas no existe o fue movida.
              <br className="hidden sm:block" />
              Prueba buscando lo que necesitas o visita nuestras categorías.
            </p>

            {/* Search */}
            <form action="/buscar" method="GET" className="flex gap-2 mb-10 max-w-sm mx-auto">
              <input
                type="text"
                name="q"
                placeholder="Buscar productos..."
                autoComplete="off"
                className="flex-1 border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-[#1A1A2E] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#1A1A2E] text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-black transition-colors shrink-0"
              >
                Buscar
              </button>
            </form>

            {/* Popular pages */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
                Páginas populares
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 border border-gray-200 rounded text-sm text-[#333333] hover:border-[#1A1A2E] hover:text-[#1A1A2E] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Back home */}
            <Link
              href="/"
              className="inline-block mt-10 text-sm text-[#888888] underline underline-offset-2 hover:text-[#111111] transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
