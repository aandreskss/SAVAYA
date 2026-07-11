'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import type { Address } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Schema ───────────────────────────────────────────────────────────────────

const addressSchema = z.object({
  name: z.string().min(2, 'Requerido'),
  address_line: z.string().min(4, 'Requerido'),
  city: z.string().min(2, 'Requerido'),
  department: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
})

type AddressFormData = z.infer<typeof addressSchema>

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ADDRESSES: Address[] = [
  {
    id: 'a1',
    user_id: 'mock',
    name: 'Casa',
    address_line: 'Calle 45 # 12-30',
    city: 'Bogotá',
    department: 'Cundinamarca',
    postal_code: '110111',
    phone: '3001234567',
    is_default: true,
  },
  {
    id: 'a2',
    user_id: 'mock',
    name: 'Oficina',
    address_line: 'Carrera 10 # 20-15',
    city: 'Medellín',
    department: 'Antioquia',
    postal_code: null,
    phone: null,
    is_default: false,
  },
]

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

// ─── Form modal ───────────────────────────────────────────────────────────────

function AddressFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Address
  onClose: () => void
  onSave: (addr: Address) => void
}) {
  const { user } = useAuth()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          address_line: initial.address_line,
          city: initial.city,
          department: initial.department ?? '',
          postal_code: initial.postal_code ?? '',
          phone: initial.phone ?? '',
        }
      : {},
  })

  async function onSubmit(data: AddressFormData) {
    if (!user?.id || !supabaseConfigured) return
    setServerError('')
    const supabase = createClient()
    const payload = {
      name: data.name,
      address_line: data.address_line,
      city: data.city,
      department: data.department || null,
      postal_code: data.postal_code || null,
      phone: data.phone || null,
    }

    if (initial) {
      const { data: updated, error } = await supabase
        .from('addresses')
        .update(payload)
        .eq('id', initial.id)
        .select()
        .single()
      if (error) { setServerError('No se pudo guardar. Intenta de nuevo.'); return }
      onSave(updated as Address)
    } else {
      const { data: created, error } = await supabase
        .from('addresses')
        .insert({ user_id: user.id, ...payload, is_default: false })
        .select()
        .single()
      if (error) { setServerError('No se pudo guardar. Intenta de nuevo.'); return }
      onSave(created as Address)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-base">
            {initial ? 'Editar dirección' : 'Nueva dirección'}
          </h3>
          <button onClick={onClose} className="text-gray-text hover:text-black text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Nombre / alias" error={errors.name?.message}>
            <input
              {...register('name')}
              placeholder="Ej: Casa, Oficina"
              className={inputCls(!!errors.name)}
            />
          </Field>
          <Field label="Dirección" error={errors.address_line?.message}>
            <input
              {...register('address_line')}
              placeholder="Calle, Carrera, Av. con número"
              className={inputCls(!!errors.address_line)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad" error={errors.city?.message}>
              <input
                {...register('city')}
                placeholder="Ciudad"
                className={inputCls(!!errors.city)}
              />
            </Field>
            <Field label="Departamento">
              <input
                {...register('department')}
                placeholder="Dpto."
                className={inputCls(false)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código postal">
              <input
                {...register('postal_code')}
                placeholder="Opcional"
                className={inputCls(false)}
              />
            </Field>
            <Field label="Teléfono">
              <input
                {...register('phone')}
                placeholder="Opcional"
                className={inputCls(false)}
              />
            </Field>
          </div>

          {serverError && <p className="text-xs text-sale">{serverError}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-light text-sm font-heading font-semibold rounded hover:border-black transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-accent text-white text-sm font-heading font-semibold rounded hover:bg-black disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DireccionesPage() {
  const { user, isLoading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Address | undefined>()

  useEffect(() => {
    if (!user?.id || !supabaseConfigured) {
      setAddresses(MOCK_ADDRESSES)
      setLoadingAddr(false)
      return
    }
    const supabase = createClient()
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        setAddresses((data as Address[]) ?? [])
        setLoadingAddr(false)
      })
  }, [user?.id])

  async function handleDelete(id: string) {
    if (!supabaseConfigured) return
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleSetDefault(id: string) {
    if (!user?.id || !supabaseConfigured) return
    const supabase = createClient()
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
  }

  function handleSaved(addr: Address) {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === addr.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = addr
        return next
      }
      return [...prev, addr]
    })
    setFormOpen(false)
    setEditing(undefined)
  }

  if (isLoading || loadingAddr) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-gray-bg rounded animate-pulse" />
        {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-bg rounded-lg animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Mis direcciones</h1>
        <button
          onClick={() => { setEditing(undefined); setFormOpen(true) }}
          className="px-4 py-2 bg-accent text-white text-sm font-heading font-semibold rounded hover:bg-black transition-colors"
        >
          + Nueva
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="border border-gray-light rounded-lg px-6 py-16 text-center">
          <p className="text-gray-text">Aún no tienes direcciones guardadas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                'border rounded-lg px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4',
                addr.is_default ? 'border-black' : 'border-gray-light',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{addr.name}</p>
                  {addr.is_default && (
                    <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase rounded-full">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-text">{addr.address_line}</p>
                <p className="text-xs text-gray-text">
                  {addr.city}
                  {addr.department ? `, ${addr.department}` : ''}
                  {addr.postal_code ? ` ${addr.postal_code}` : ''}
                </p>
                {addr.phone && <p className="text-xs text-gray-text">{addr.phone}</p>}
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs font-medium">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-gray-text hover:text-black underline underline-offset-2 transition-colors"
                  >
                    Usar como principal
                  </button>
                )}
                <button
                  onClick={() => { setEditing(addr); setFormOpen(true) }}
                  className="text-gray-text hover:text-black underline underline-offset-2 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-sale hover:opacity-75 underline underline-offset-2 transition-opacity"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <AddressFormModal
          initial={editing}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          onSave={handleSaved}
        />
      )}
    </div>
  )
}
