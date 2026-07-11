'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveDiscount } from '@/app/dashboard/descuentos/actions'
import type { DiscountCode, DiscountType } from '@/lib/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0.01, 'Debe ser mayor a 0'),
  min_purchase_raw: z.string(),
  max_uses_raw: z.string(),
  expires_at: z.string(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const INPUT =
  'w-full border border-gray-light rounded px-3 py-2.5 text-sm font-body focus:border-black focus:outline-none transition-colors'
const LABEL = 'block text-sm font-heading font-semibold text-black mb-1.5'
const ERROR = 'text-xs text-sale font-body mt-1'

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  discount?: DiscountCode
}

export default function DiscountForm({ discount }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState('')
  const isEditing = !!discount

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: discount?.code ?? '',
      type: discount?.type ?? 'percentage',
      value: discount?.value ?? ('' as unknown as number),
      min_purchase_raw: discount?.min_purchase ? String(discount.min_purchase) : '',
      max_uses_raw: discount?.max_uses ? String(discount.max_uses) : '',
      expires_at: discount?.expires_at
        ? new Date(discount.expires_at).toISOString().slice(0, 10)
        : '',
      is_active: discount?.is_active ?? true,
    },
  })

  const type = watch('type')

  function handleGenerate() {
    setValue('code', generateCode(), { shouldValidate: true })
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    const minPurchase = values.min_purchase_raw ? parseFloat(values.min_purchase_raw) : null
    const maxUses = values.max_uses_raw ? parseInt(values.max_uses_raw, 10) : null
    const expiresAt = values.expires_at
      ? new Date(values.expires_at + 'T23:59:59').toISOString()
      : null

    const data = {
      code: values.code.toUpperCase(),
      type: values.type as DiscountType,
      value: values.value,
      min_purchase: minPurchase && minPurchase > 0 ? minPurchase : null,
      max_uses: maxUses && maxUses > 0 ? maxUses : null,
      expires_at: expiresAt,
      is_active: values.is_active,
    }

    startTransition(async () => {
      const result = await saveDiscount(data, discount?.id)
      if ('error' in result) {
        setServerError(result.error)
        return
      }
      router.push('/dashboard/descuentos')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-heading font-bold text-black">
          {isEditing ? 'Editar código' : 'Nuevo código de descuento'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/descuentos')}
            className="text-sm font-body text-gray-text hover:text-black transition-colors px-4 py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isPending ? 'Guardando…' : 'Guardar código'}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-sale font-body">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Code */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Código</h2>
            <div>
              <label className={LABEL}>Código de descuento *</label>
              <div className="flex items-center gap-2">
                <input
                  {...register('code', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase()
                    },
                  })}
                  className={`${INPUT} font-heading font-bold tracking-widest uppercase flex-1`}
                  placeholder="BIENVENIDO20"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="shrink-0 border border-gray-light rounded px-3 py-2.5 text-sm font-body hover:border-black hover:bg-gray-bg transition-colors whitespace-nowrap"
                >
                  Generar
                </button>
              </div>
              {errors.code && <p className={ERROR}>{errors.code.message}</p>}
              <p className="text-[11px] text-gray-text font-body mt-1">
                El código no distingue mayúsculas. Ej: VERANO10, BFRIDAY
              </p>
            </div>
          </div>

          {/* Discount value */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Descuento</h2>
            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className={LABEL}>Tipo de descuento *</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'percentage', label: '% Porcentaje', desc: 'Ej: 20% de descuento' },
                    { value: 'fixed', label: '$ Monto fijo', desc: 'Ej: $10.000 de descuento' },
                  ] as const).map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded border p-3 transition-colors ${
                        type === value
                          ? 'border-black bg-black text-white'
                          : 'border-gray-light hover:border-gray-text'
                      }`}
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register('type')}
                        className="sr-only"
                      />
                      <p className={`text-sm font-heading font-semibold ${type === value ? 'text-white' : 'text-black'}`}>
                        {label}
                      </p>
                      <p className={`text-[11px] mt-0.5 font-body ${type === value ? 'text-white/70' : 'text-gray-text'}`}>
                        {desc}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div>
                <label className={LABEL}>
                  {type === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm font-body">
                    {type === 'percentage' ? '%' : '$'}
                  </span>
                  <input
                    type="number"
                    min={0.01}
                    max={type === 'percentage' ? 100 : undefined}
                    step={type === 'percentage' ? 1 : 100}
                    {...register('value', { valueAsNumber: true })}
                    className={`${INPUT} pl-7`}
                    placeholder={type === 'percentage' ? '20' : '10000'}
                  />
                </div>
                {errors.value && <p className={ERROR}>{errors.value.message}</p>}
                {type === 'percentage' && (
                  <p className="text-[11px] text-gray-text font-body mt-1">Entre 1 y 100</p>
                )}
              </div>
            </div>
          </div>

          {/* Restrictions */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Restricciones</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>
                  Compra mínima{' '}
                  <span className="font-body font-normal text-gray-text">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    {...register('min_purchase_raw')}
                    className={`${INPUT} pl-7`}
                    placeholder="50000"
                  />
                </div>
                <p className="text-[11px] text-gray-text font-body mt-1">Vacío = sin mínimo</p>
              </div>

              <div>
                <label className={LABEL}>
                  Máximo de usos{' '}
                  <span className="font-body font-normal text-gray-text">(opcional)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  {...register('max_uses_raw')}
                  className={INPUT}
                  placeholder="100"
                />
                <p className="text-[11px] text-gray-text font-body mt-1">Vacío = ilimitado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Status */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Estado</h2>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('is_active')}
                className="mt-0.5 w-4 h-4 rounded accent-black cursor-pointer"
              />
              <div>
                <p className="text-sm font-body font-medium text-black group-hover:text-accent transition-colors">
                  Código activo
                </p>
                <p className="text-[11px] text-gray-text font-body">
                  Los clientes podrán canjearlo en el checkout
                </p>
              </div>
            </label>
          </div>

          {/* Expiry */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Vencimiento</h2>
            <div>
              <label className={LABEL}>
                Fecha de vencimiento{' '}
                <span className="font-body font-normal text-gray-text">(opcional)</span>
              </label>
              <input
                type="date"
                {...register('expires_at')}
                className={INPUT}
                min={new Date().toISOString().slice(0, 10)}
              />
              <p className="text-[11px] text-gray-text font-body mt-1">
                El código expira al final del día seleccionado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom save */}
      <div className="mt-6 flex items-center justify-end gap-3 py-4 border-t border-gray-light">
        <button
          type="button"
          onClick={() => router.push('/dashboard/descuentos')}
          className="text-sm font-body text-gray-text hover:text-black transition-colors px-4 py-2.5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-6 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isPending && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isPending ? 'Guardando…' : 'Guardar código'}
        </button>
      </div>
    </form>
  )
}
