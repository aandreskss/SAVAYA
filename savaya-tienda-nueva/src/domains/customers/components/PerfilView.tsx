'use client'

import { useState, useTransition } from 'react'
import { UpdateProfileSchema, type UpdateProfileInput } from '../validators'
import { updateProfile } from '../actions'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui/toast-store'

type FormErrors = Partial<Record<keyof UpdateProfileInput, string>>

interface Props {
  email: string
  firstName: string
  lastName: string
  phone: string
  whatsapp: string
}

export function PerfilView({ email, firstName, lastName, phone, whatsapp }: Props) {
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<UpdateProfileInput>({
    firstName,
    lastName,
    phone: phone || '',
    whatsapp: whatsapp || '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  function field(key: keyof UpdateProfileInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = UpdateProfileSchema.safeParse(form)
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof UpdateProfileInput
        if (k && !errs[k]) errs[k] = issue.message
      }
      setErrors(errs)
      return
    }

    startTransition(async () => {
      const res = await updateProfile(result.data)
      if (res.success) {
        toast.success('Perfil actualizado correctamente.')
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="max-w-md space-y-6">
      <h2 className="font-medium text-base">Información personal</h2>

      {/* Email — read-only */}
      <div>
        <label className="block text-sm font-medium mb-1">Correo electrónico</label>
        <div className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-secondary">
          {email}
        </div>
        <p className="text-xs text-text-secondary mt-1">
          El correo no se puede cambiar desde aquí.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nombre" error={errors.firstName}>
            <input
              value={form.firstName}
              onChange={(e) => field('firstName', e.target.value)}
              autoComplete="given-name"
              className={inputClass(!!errors.firstName)}
            />
          </FormField>
          <FormField label="Apellido" error={errors.lastName}>
            <input
              value={form.lastName}
              onChange={(e) => field('lastName', e.target.value)}
              autoComplete="family-name"
              className={inputClass(!!errors.lastName)}
            />
          </FormField>
        </div>

        <FormField label="Teléfono (opcional)" error={errors.phone}>
          <input
            value={form.phone ?? ''}
            onChange={(e) => field('phone', e.target.value)}
            type="tel"
            placeholder="0414 1234567"
            autoComplete="tel"
            className={inputClass(!!errors.phone)}
          />
        </FormField>

        <FormField label="WhatsApp (opcional)" error={errors.whatsapp}>
          <input
            value={form.whatsapp ?? ''}
            onChange={(e) => field('whatsapp', e.target.value)}
            type="tel"
            placeholder="0414 1234567"
            className={inputClass(!!errors.whatsapp)}
          />
        </FormField>

        <Button type="submit" isLoading={isPending}>
          Guardar cambios
        </Button>
      </form>
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
