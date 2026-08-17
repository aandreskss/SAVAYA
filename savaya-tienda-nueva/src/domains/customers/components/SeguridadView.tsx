'use client'

import { useState, useTransition } from 'react'
import { ChangePasswordSchema, type ChangePasswordInput } from '../validators'
import { changePassword } from '../actions'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui/toast-store'

type FormErrors = Partial<Record<keyof ChangePasswordInput, string>>

interface ActiveSession {
  id: string
  expires: Date
}

interface Props {
  activeSessions: ActiveSession[]
}

const emptyForm: ChangePasswordInput = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export function SeguridadView({ activeSessions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<ChangePasswordInput>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})

  function field(key: keyof ChangePasswordInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = ChangePasswordSchema.safeParse(form)
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof ChangePasswordInput
        if (k && !errs[k]) errs[k] = issue.message
      }
      setErrors(errs)
      return
    }

    startTransition(async () => {
      const res = await changePassword(result.data)
      if (res.success) {
        toast.success('Contraseña actualizada correctamente.')
        setForm(emptyForm)
        setErrors({})
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-8 max-w-md">
      {/* Change password */}
      <section>
        <h2 className="font-medium text-base mb-4">Cambiar contraseña</h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Contraseña actual" error={errors.currentPassword}>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => field('currentPassword', e.target.value)}
              autoComplete="current-password"
              className={inputClass(!!errors.currentPassword)}
            />
          </FormField>

          <FormField label="Nueva contraseña" error={errors.newPassword}>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => field('newPassword', e.target.value)}
              autoComplete="new-password"
              className={inputClass(!!errors.newPassword)}
            />
            <p className="text-xs text-text-secondary mt-1">Mínimo 8 caracteres.</p>
          </FormField>

          <FormField label="Confirmar nueva contraseña" error={errors.confirmPassword}>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => field('confirmPassword', e.target.value)}
              autoComplete="new-password"
              className={inputClass(!!errors.confirmPassword)}
            />
          </FormField>

          <Button type="submit" isLoading={isPending}>
            Cambiar contraseña
          </Button>
        </form>
      </section>

      {/* Active sessions */}
      <section>
        <h2 className="font-medium text-base mb-4">Sesiones activas</h2>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No hay sesiones activas disponibles.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg text-sm"
              >
                <div>
                  <p className="font-medium">Sesión activa</p>
                  <p className="text-xs text-text-secondary">
                    Expira:{' '}
                    {s.expires.toLocaleDateString('es-VE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-text-secondary mt-3">
          Para cerrar todas las sesiones, cambia tu contraseña o usa &quot;Cerrar sesión&quot; en el menú.
        </p>
      </section>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full border ${hasError ? 'border-error' : 'border-border'} rounded-md px-3 py-2 text-sm bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-gold transition-colors`
}
