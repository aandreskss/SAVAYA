'use client'

import { useState } from 'react'
import { PersonalDataSchema } from '../validators'
import { useCheckoutStore } from '../checkout-store'
import type { PersonalData } from '../types'

export function StepPersonalData() {
  const { personalData, setPersonalData } = useCheckoutStore()

  const [form, setForm] = useState<PersonalData>(
    personalData ?? { firstName: '', lastName: '', email: '', whatsapp: '' },
  )
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalData, string>>>({})

  function handleChange(field: keyof PersonalData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = PersonalDataSchema.safeParse(form)
    if (!result.success) {
      const errs: typeof errors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PersonalData
        if (field && !errs[field]) errs[field] = issue.message
      }
      setErrors(errs)
      return
    }
    setPersonalData(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-text-primary">
        Tus datos
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre"
          id="firstName"
          value={form.firstName}
          error={errors.firstName}
          autoComplete="given-name"
          onChange={(v) => handleChange('firstName', v)}
        />
        <Field
          label="Apellido"
          id="lastName"
          value={form.lastName}
          error={errors.lastName}
          autoComplete="family-name"
          onChange={(v) => handleChange('lastName', v)}
        />
      </div>

      <Field
        label="Correo electrónico"
        id="email"
        type="email"
        value={form.email}
        error={errors.email}
        autoComplete="email"
        onChange={(v) => handleChange('email', v)}
      />

      <Field
        label="WhatsApp"
        id="whatsapp"
        type="tel"
        placeholder="0414 1234567"
        value={form.whatsapp}
        error={errors.whatsapp}
        autoComplete="tel"
        hint="Te enviaremos el estado de tu pedido por aquí."
        onChange={(v) => handleChange('whatsapp', v)}
      />

      <button
        type="submit"
        className="btn-primary w-full"
      >
        Continuar con la entrega
      </button>
    </form>
  )
}

// ── Field helper ──────────────────────────────────────────────────────────────

type FieldProps = {
  label: string
  id: string
  value: string
  error?: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  placeholder?: string
  hint?: string
}

function Field({ label, id, value, error, onChange, type = 'text', autoComplete, placeholder, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={[
          'input',
          error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : '',
        ].join(' ')}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-text-secondary)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  )
}
