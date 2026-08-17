'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterCustomerSchema, type RegisterCustomerInput } from '@/domains/auth/validators'
import { registerCustomer, loginCustomer } from '@/domains/auth/actions'
import { Button } from '@/shared/ui/Button'

type FormErrors = Partial<Record<keyof RegisterCustomerInput | 'confirmPassword', string>>

type FormState = RegisterCustomerInput & { confirmPassword: string }

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

export function RegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState('')

  function field(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
    if (globalError) setGlobalError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side: check passwords match before sending to server
    if (form.password !== form.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }))
      return
    }

    const result = RegisterCustomerSchema.safeParse(form)
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof FormErrors
        if (k && !errs[k]) errs[k] = issue.message
      }
      setErrors(errs)
      return
    }

    startTransition(async () => {
      const regResult = await registerCustomer(result.data)
      if (!regResult.success) {
        setGlobalError(regResult.error)
        return
      }

      // Auto-login after successful registration
      const loginResult = await loginCustomer({ email: result.data.email, password: result.data.password })
      if (loginResult.success) {
        router.push('/mi-cuenta')
        router.refresh()
      } else {
        // Registration worked but auto-login failed — send to login page
        router.push('/iniciar-sesion?registered=1')
      }
    })
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

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre" error={errors.firstName}>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => field('firstName', e.target.value)}
            autoComplete="given-name"
            className={inputClass(!!errors.firstName)}
          />
        </FormField>
        <FormField label="Apellido" error={errors.lastName}>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => field('lastName', e.target.value)}
            autoComplete="family-name"
            className={inputClass(!!errors.lastName)}
          />
        </FormField>
      </div>

      <FormField label="Correo electrónico" error={errors.email}>
        <input
          type="email"
          value={form.email}
          onChange={(e) => field('email', e.target.value)}
          autoComplete="email"
          className={inputClass(!!errors.email)}
        />
      </FormField>

      <FormField label="Teléfono" error={errors.phone}>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => field('phone', e.target.value)}
          placeholder="0414 1234567"
          autoComplete="tel"
          className={inputClass(!!errors.phone)}
        />
      </FormField>

      <FormField label="Contraseña" error={errors.password}>
        <input
          type="password"
          value={form.password}
          onChange={(e) => field('password', e.target.value)}
          autoComplete="new-password"
          className={inputClass(!!errors.password)}
        />
        <p className="text-xs text-text-secondary mt-1">Mínimo 8 caracteres.</p>
      </FormField>

      <FormField label="Confirmar contraseña" error={errors.confirmPassword}>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => field('confirmPassword', e.target.value)}
          autoComplete="new-password"
          className={inputClass(!!errors.confirmPassword)}
        />
      </FormField>

      <Button type="submit" isLoading={isPending} className="w-full">
        Crear cuenta
      </Button>

      <p className="text-xs text-text-secondary text-center">
        Al crear una cuenta aceptas nuestra{' '}
        <a href="/privacidad" className="underline underline-offset-2">
          Política de Privacidad
        </a>
        .
      </p>
    </form>
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
