'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/cuenta/perfil`,
    })

    setLoading(false)

    if (error) {
      setError('No pudimos enviar el correo. Verifica la dirección e inténtalo de nuevo.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-gray-light shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Revisa tu correo</h2>
          <p className="text-gray-text text-sm mb-1">
            Si <span className="font-semibold text-black">{email}</span> tiene una cuenta, recibirás un enlace para restablecer tu contraseña.
          </p>
          <p className="text-xs text-gray-text mt-4">
            ¿No lo ves? Revisa la carpeta de spam o{' '}
            <button
              onClick={() => setSubmitted(false)}
              className="underline underline-offset-2 hover:text-black"
            >
              inténtalo de nuevo
            </button>
            .
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm underline underline-offset-2 text-gray-text hover:text-black"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg border border-gray-light shadow-sm p-8">
        <h1 className="font-display text-2xl font-bold mb-1">Recupera tu contraseña</h1>
        <p className="text-sm text-gray-text mb-7">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-sm text-sale bg-sale/8 border border-sale/25 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-email" className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gray-text">
              Correo electrónico
            </label>
            <input
              id="reset-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="border border-gray-light rounded px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-heading font-semibold text-sm py-3 rounded hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Enviar enlace de recuperación
          </button>
        </form>

        <p className="text-center text-sm text-gray-text mt-6">
          <Link href="/login" className="underline underline-offset-2 hover:text-black">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
