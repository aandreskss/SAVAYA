'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[AdminError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <p className="font-display text-6xl tracking-widest text-text-primary opacity-10 select-none mb-2">
        500
      </p>
      <h1 className="font-medium text-lg mb-2">Algo salió mal</h1>
      <p className="text-text-secondary text-sm mb-6 max-w-sm">
        Ocurrió un error en el panel. El equipo fue notificado.
      </p>
      <button
        onClick={reset}
        className="bg-accent-gold text-text-primary-inverse px-5 py-2 rounded-full text-sm font-medium hover:bg-accent-gold-hover transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
