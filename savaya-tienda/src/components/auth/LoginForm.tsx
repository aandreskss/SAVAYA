'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.'
  if (msg.includes('Too many requests')) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  if (msg.includes('User not found')) return 'No existe una cuenta con ese correo.'
  return 'Ocurrió un error. Inténtalo de nuevo.'
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/cuenta'
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(translateError(error.message))
      setLoading(false)
      return
    }

    // Migrate any local cart items to the user's account (fire and forget)
    const cartItems = useCartStore.getState().items
    if (cartItems.length > 0) {
      fetch('/api/auth/migrate-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      }).catch(() => {})
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) {
      setError(translateError(error.message))
      setGoogleLoading(false)
    }
    // On success, browser redirects to Google — no state update needed
  }

  const displayError = error ?? (urlError ? 'Ocurrió un error de autenticación. Inténtalo de nuevo.' : null)

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg border border-gray-light shadow-sm p-8">
        <h1 className="font-display text-2xl font-bold mb-1">Bienvenido de nuevo</h1>
        <p className="text-sm text-gray-text mb-7">Inicia sesión para continuar comprando</p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || googleLoading}
          className={cn(
            'w-full flex items-center justify-center gap-3 border border-gray-light rounded py-2.5',
            'text-sm font-medium hover:bg-gray-bg transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {googleLoading ? (
            <span className="w-4 h-4 border-2 border-gray-light border-t-gray-text rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-light" />
          <span className="text-xs text-gray-text shrink-0">o con tu correo</span>
          <div className="flex-1 h-px bg-gray-light" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {displayError && (
            <p role="alert" className="text-sm text-sale bg-sale/8 border border-sale/25 rounded px-3 py-2">
              {displayError}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gray-text">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="border border-gray-light rounded px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gray-text">
                Contraseña
              </label>
              <Link
                href="/recuperar-contrasena"
                className="text-xs text-gray-text hover:text-black underline underline-offset-2"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-light rounded px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-black"
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-accent text-white font-heading font-semibold text-sm py-3 rounded hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-sm text-gray-text mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-black font-semibold underline underline-offset-2">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
