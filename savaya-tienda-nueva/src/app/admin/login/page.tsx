'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginAdmin } from '@/domains/auth/actions'

export default function AdminLoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await loginAdmin({
        email,
        password,
        totpCode: totpCode.trim() || undefined,
      })

      if (result.success) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-display text-3xl uppercase tracking-[0.2em] text-accent-gold">
            SAVAYA
          </p>
          <p className="text-text-secondary text-sm mt-1">Panel de administración</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
          <h1 className="font-medium text-base mb-6">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition-colors"
              />
            </div>

            <div>
              <label htmlFor="totpCode" className="block text-sm font-medium mb-1.5">
                Código 2FA{' '}
                <span className="text-text-secondary font-normal">(si está configurado)</span>
              </label>
              <input
                id="totpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="——————"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition-colors tracking-[0.25em] text-center font-mono"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-error bg-error/5 border border-error/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-accent-gold text-text-primary-inverse py-2.5 rounded-full text-sm font-medium hover:bg-accent-gold-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-secondary mt-6">
          SAVAYA — Panel interno. No compartir acceso.
        </p>
      </div>
    </div>
  )
}
