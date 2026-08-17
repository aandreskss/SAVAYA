'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Sentry will pick this up automatically via @sentry/nextjs instrumentation
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-8xl md:text-9xl tracking-widest text-text-primary opacity-10 select-none">
        500
      </p>
      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wide -mt-4">
        Algo salió mal
      </h1>
      <p className="text-text-secondary mt-3 mb-8 max-w-sm">
        Ocurrió un error inesperado. El equipo ya fue notificado.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="bg-accent-gold text-text-primary-inverse px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-gold-hover transition-colors"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="border border-border text-text-primary px-6 py-2.5 rounded-full text-sm font-medium hover:bg-surface-2 hover:border-border-hover transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}
