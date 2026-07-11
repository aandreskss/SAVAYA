'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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

function translateError(msg: string): string {
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Unable to validate email')) return 'El correo electrónico no es válido.'
  if (msg.includes('Too many requests')) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  return 'Ocurrió un error. Inténtalo de nuevo.'
}

// Simple password strength: 0-3
function passwordStrength(pw: string): number {
  if (pw.length === 0) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const strengthLabel = ['', 'Débil', 'Regular', 'Fuerte']
const strengthColor = ['', 'bg-sale', 'bg-gold', 'bg-green-500']

export default function RegisterForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const pwStrength = passwordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    })

    if (error) {
      setError(translateError(error.message))
      setLoading(false)
      return
    }

    if (data.session) {
      // Email confirmation disabled — user is immediately logged in
      await supabase.from('profiles').upsert(
        { id: data.user!.id, name },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      void fetch('/api/emails/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, customerName: name }),
      })
      router.push('/cuenta')
      router.refresh()
    } else {
      // Email confirmation required — send welcome after they verify
      void fetch('/api/emails/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, customerName: name }),
      })
      setSubmitted(true)
    }
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/cuenta`,
      },
    })
    if (error) {
      setError(translateError(error.message))
      setGoogleLoading(false)
    }
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
            Enviamos un enlace de confirmación a
          </p>
          <p className="font-semibold text-sm mb-6">{email}</p>
          <p className="text-gray-text text-xs">
            Haz clic en el enlace para activar tu cuenta. Si no lo encuentras, revisa tu carpeta de spam.
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
        <h1 className="font-display text-2xl font-bold mb-1">Crea tu cuenta</h1>
        <p className="text-sm text-gray-text mb-7">Únete y descubre las últimas tendencias</p>

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
          Registrarse con Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-light" />
          <span className="text-xs text-gray-text shrink-0">o con tu correo</span>
          <div className="flex-1 h-px bg-gray-light" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-sm text-sale bg-sale/8 border border-sale/25 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-name" className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gray-text">
              Nombre completo
            </label>
            <input
              id="reg-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="border border-gray-light rounded px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-email" className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gray-text">
              Correo electrónico
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gray-text">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
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
            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors duration-300',
                        pwStrength >= lvl ? strengthColor[pwStrength] : 'bg-gray-light'
                      )}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-gray-text">{strengthLabel[pwStrength]}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-accent text-white font-heading font-semibold text-sm py-3 rounded hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Crear cuenta
          </button>

          <p className="text-xs text-gray-text text-center">
            Al registrarte aceptas nuestros{' '}
            <Link href="/terminos" className="underline underline-offset-2 hover:text-black">
              Términos de uso
            </Link>
            {' '}y{' '}
            <Link href="/privacidad" className="underline underline-offset-2 hover:text-black">
              Política de privacidad
            </Link>
          </p>
        </form>

        <p className="text-center text-sm text-gray-text mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-black font-semibold underline underline-offset-2">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
