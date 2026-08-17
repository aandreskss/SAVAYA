import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada | SAVAYA',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-8xl md:text-9xl tracking-widest text-text-primary opacity-10 select-none">
        404
      </p>
      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wide -mt-4">
        Página no encontrada
      </h1>
      <p className="text-text-secondary mt-3 mb-8 max-w-sm">
        La página que buscas no existe o fue movida a otra dirección.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="bg-accent-gold text-text-primary-inverse px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-gold-hover transition-colors"
        >
          Ir al inicio
        </Link>
        <Link
          href="/contacto"
          className="border border-border text-text-primary px-6 py-2.5 rounded-full text-sm font-medium hover:bg-surface-2 hover:border-border-hover transition-colors"
        >
          Contacto
        </Link>
      </div>
    </main>
  )
}
