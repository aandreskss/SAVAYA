'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  phone: z.string().max(20).optional(),
})

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return cn(
    'w-full px-3.5 py-2.5 border rounded text-sm outline-none transition-colors',
    hasError ? 'border-sale focus:border-sale' : 'border-gray-light focus:border-black',
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-heading font-semibold uppercase tracking-widest text-gray-text">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-sale">{error}</p>}
    </div>
  )
}

// ─── Profile section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, profile } = useAuth()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '' },
  })

  useEffect(() => {
    if (profile) reset({ name: profile.name ?? '', phone: profile.phone ?? '' })
  }, [profile, reset])

  async function onSubmit(data: ProfileFormData) {
    if (!user?.id || !supabaseConfigured) return
    setServerError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, phone: data.phone || null })
      .eq('id', user.id)
    if (error) { setServerError('No se pudo guardar. Intenta de nuevo.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading font-bold text-base">Datos personales</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
        <Field label="Nombre completo" error={errors.name?.message}>
          <input
            {...register('name')}
            placeholder="Tu nombre"
            className={inputCls(!!errors.name)}
          />
        </Field>
        <Field label="Teléfono" error={errors.phone?.message}>
          <input
            {...register('phone')}
            placeholder="Ej: 3001234567"
            className={inputCls(!!errors.phone)}
          />
        </Field>
        <Field label="Correo electrónico">
          <input
            value={user?.email ?? ''}
            readOnly
            className={cn(inputCls(false), 'opacity-50 cursor-not-allowed bg-gray-bg')}
          />
        </Field>
        {serverError && <p className="text-xs text-sale">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'self-start px-6 py-2.5 text-sm font-heading font-bold rounded transition-colors',
            saved
              ? 'bg-green-600 text-white'
              : 'bg-accent text-white hover:bg-black disabled:opacity-60',
          )}
        >
          {saved ? '✓ Guardado' : isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  )
}

// ─── Password section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  async function onSubmit(data: PasswordFormData) {
    if (!supabaseConfigured) return
    setServerError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { setServerError('No se pudo actualizar. Intenta de nuevo.'); return }
    reset()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading font-bold text-base">Cambiar contraseña</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
        <Field label="Nueva contraseña" error={errors.password?.message}>
          <input
            type="password"
            {...register('password')}
            placeholder="Mínimo 6 caracteres"
            className={inputCls(!!errors.password)}
          />
        </Field>
        <Field label="Confirmar contraseña" error={errors.confirm?.message}>
          <input
            type="password"
            {...register('confirm')}
            placeholder="Repite la contraseña"
            className={inputCls(!!errors.confirm)}
          />
        </Field>
        {serverError && <p className="text-xs text-sale">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'self-start px-6 py-2.5 text-sm font-heading font-bold rounded transition-colors',
            saved
              ? 'bg-green-600 text-white'
              : 'bg-accent text-white hover:bg-black disabled:opacity-60',
          )}
        >
          {saved
            ? '✓ Contraseña actualizada'
            : isSubmitting
            ? 'Actualizando…'
            : 'Actualizar contraseña'}
        </button>
      </form>
    </section>
  )
}

// ─── Delete section ───────────────────────────────────────────────────────────

function DeleteSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/account/delete', { method: 'POST' })
    if (!res.ok) {
      setError('No se pudo eliminar la cuenta. Intenta de nuevo.')
      setLoading(false)
      return
    }
    router.push('/')
  }

  return (
    <section className="flex flex-col gap-4 border-t border-gray-light pt-8">
      <div>
        <h2 className="font-heading font-bold text-base text-sale">Zona peligrosa</h2>
        <p className="text-xs text-gray-text mt-1">
          Una vez eliminada tu cuenta no podrás recuperarla.
        </p>
      </div>
      <button
        onClick={() => setOpen(true)}
        className="self-start px-5 py-2 border border-sale text-sale text-sm font-heading font-semibold rounded hover:bg-sale hover:text-white transition-colors"
      >
        Eliminar mi cuenta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => { setOpen(false); setInput('') }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-lg max-w-sm w-full mx-4 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-base mb-2">¿Eliminar cuenta?</h3>
            <p className="text-sm text-gray-text mb-4">
              Esta acción es irreversible. Escribe{' '}
              <strong className="text-black">ELIMINAR</strong> para confirmar.
            </p>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ELIMINAR"
              className={inputCls(false)}
            />
            {error && <p className="text-xs text-sale mt-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setOpen(false); setInput('') }}
                className="flex-1 py-2.5 border border-gray-light text-sm font-heading font-semibold rounded hover:border-black transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={input !== 'ELIMINAR' || loading}
                className="flex-1 py-2.5 bg-sale text-white text-sm font-heading font-semibold rounded disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {loading ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-32 bg-gray-bg rounded animate-pulse" />
        <div className="flex flex-col gap-4 max-w-md">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-2xl font-bold">Mi perfil</h1>
      <ProfileSection />
      <div className="border-t border-gray-light" />
      <PasswordSection />
      <DeleteSection />
    </div>
  )
}
