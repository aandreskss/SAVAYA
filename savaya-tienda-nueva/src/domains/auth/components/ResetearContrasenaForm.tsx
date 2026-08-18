'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/domains/auth/actions'
import { Button } from '@/shared/ui/Button'

function inputClass(hasError: boolean) {
  return `w-full border ${hasError ? 'border-error' : 'border-border'} rounded-md px-3 py-2 text-sm bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-gold transition-colors`
}

interface Props {
  token: string
  email: string
}

export function ResetearContrasenaForm({ token, email }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState(false)

  function validate() {
    const errs: typeof errors = {}
    if (newPassword.length < 8) errs.newPassword = 'La contraseña debe tener al menos 8 caracteres.'
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden.'
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setGlobalError('')

    startTransition(async () => {
      const res = await resetPassword(token, email, newPassword)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => router.push('/iniciar-sesion'), 2500)
      } else {
        setGlobalError(res.error)
      }
    })
  }

  if (success) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-6 text-center space-y-3">
        <div className="text-3xl">✓</div>
        <p className="font-medium">¡Contraseña actualizada!</p>
        <p className="text-sm text-text-secondary">
          Tu contraseña fue cambiada exitosamente. Serás redirigido al inicio de sesión…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {globalError && (
        <div
          role="alert"
          className="bg-error/10 border border-error/30 rounded-md px-4 py-3 text-sm text-error"
        >
          {globalError}
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
          Nueva contraseña
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value)
            if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined }))
          }}
          autoComplete="new-password"
          className={inputClass(!!errors.newPassword)}
        />
        {errors.newPassword && <p className="text-xs text-error mt-1">{errors.newPassword}</p>}
        <p className="text-xs text-text-secondary mt-1">Mínimo 8 caracteres.</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }))
          }}
          autoComplete="new-password"
          className={inputClass(!!errors.confirmPassword)}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-error mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">
        Guardar nueva contraseña
      </Button>
    </form>
  )
}
