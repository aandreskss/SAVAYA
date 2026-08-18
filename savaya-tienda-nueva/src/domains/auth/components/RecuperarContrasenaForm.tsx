'use client'

import { useState, useTransition } from 'react'
import { requestPasswordReset } from '@/domains/auth/actions'
import { Button } from '@/shared/ui/Button'

function inputClass(hasError: boolean) {
  return `w-full border ${hasError ? 'border-error' : 'border-border'} rounded-md px-3 py-2 text-sm bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-gold transition-colors`
}

export function RecuperarContrasenaForm() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un correo electrónico válido.')
      return
    }
    setEmailError('')

    startTransition(async () => {
      await requestPasswordReset(email)
      // Always show success to avoid email enumeration
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-6 text-center space-y-3">
        <div className="text-3xl">✉️</div>
        <p className="font-medium">Revisa tu correo</p>
        <p className="text-sm text-text-secondary">
          Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para
          restablecer tu contraseña en los próximos minutos.
        </p>
        <p className="text-xs text-text-secondary pt-2">
          ¿No llegó? Revisa tu carpeta de spam o{' '}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            intenta de nuevo
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (emailError) setEmailError('')
          }}
          autoComplete="email"
          placeholder="tu@correo.com"
          className={inputClass(!!emailError)}
        />
        {emailError && <p className="text-xs text-error mt-1">{emailError}</p>}
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">
        Enviar enlace de recuperación
      </Button>
    </form>
  )
}
