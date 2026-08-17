'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LoginSchema, type LoginInput } from '@/domains/auth/validators'
import { loginCustomer } from '@/domains/auth/actions'
import { Button } from '@/shared/ui/Button'

type FormErrors = Partial<Record<keyof LoginInput, string>>

interface Props {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<LoginInput>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState('')

  function field(key: keyof LoginInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (globalError) setGlobalError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = LoginSchema.safeParse(form)
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof LoginInput
        if (k && !errs[k]) errs[k] = issue.message
      }
      setErrors(errs)
      return
    }

    startTransition(async () => {
      const res = await loginCustomer(result.data)
      if (res.success) {
        router.push(redirectTo ?? '/mi-cuenta')
        router.refresh()
      } else {
        setGlobalError(res.error)
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

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => field('email', e.target.value)}
          autoComplete="email"
          className={inputClass(!!errors.email)}
        />
        {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => field('password', e.target.value)}
          autoComplete="current-password"
          className={inputClass(!!errors.password)}
        />
        {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
      </div>

      <div className="text-right">
        <a
          href="/recuperar-contrasena"
          className="text-xs text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">
        Iniciar sesión
      </Button>
    </form>
  )
}

function inputClass(hasError: boolean) {
  return `w-full border ${hasError ? 'border-error' : 'border-border'} rounded-md px-3 py-2 text-sm bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-gold transition-colors`
}
