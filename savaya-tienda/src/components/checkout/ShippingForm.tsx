'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import type { ShippingPrices } from '@/lib/types'

// ─── Venezuelan states ────────────────────────────────────────────────────────

const CARABOBO_MUNICIPALITIES = [
  'Valencia', 'Naguanagua', 'San Diego', 'Libertador', 'Los Guayos',
  'Guacara', 'San Joaquín', 'Bejuma', 'Montalbán', 'Miranda',
  'Puerto Cabello', 'Carlos Arvelo', 'Diego Ibarra', 'Juan José Mora',
]

const VE_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
  'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
  'Guárico', 'La Guaira', 'Lara', 'Mérida', 'Miranda', 'Monagas',
  'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Yaracuy', 'Zulia',
]

const COMPANIES = [
  { id: 'zoom', label: 'Zoom' },
  { id: 'tealca', label: 'Tealca' },
  { id: 'mrw', label: 'MRW' },
]

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  delivery_type: z.enum(['office', 'home', 'store']),
  name: z.string().min(3, 'Ingresa tu nombre completo'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().min(7, 'Teléfono inválido').regex(/^\+?[0-9\s\-()+]+$/, 'Solo números y signos'),
  state: z.string().optional(),
  city: z.string().optional(),
  shipping_company: z.string().optional(),
  office: z.string().optional(),
  address_line: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.delivery_type === 'office') {
    if (!data.state) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona tu estado', path: ['state'] })
    }
    if (!data.city || data.city.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa tu ciudad', path: ['city'] })
    }
    if (!data.shipping_company) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona la empresa de envío', path: ['shipping_company'] })
    }
    if (!data.office || data.office.trim().length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Describe la agencia (nombre, dirección o referencia)', path: ['office'] })
    }
  }
  if (data.delivery_type === 'home') {
    if (!data.state) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona tu estado', path: ['state'] })
    }
    if (!data.city || data.city.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa tu ciudad', path: ['city'] })
    }
    if (!data.address_line || data.address_line.trim().length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa tu dirección completa', path: ['address_line'] })
    }
  }
  // store: no extra validation beyond contact info
})

type FormValues = z.infer<typeof schema>

// ─── Public type (consumed by CheckoutClient, PaymentForm, API) ───────────────

export type ShippingFormData = {
  name: string
  email: string
  phone: string
  address_line: string
  city: string
  department: string
  postal_code?: string
  notes?: string
  delivery_type?: 'home' | 'office' | 'store'
  shipping_company?: string
  office?: string
  state?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  defaultValues?: Partial<ShippingFormData>
  enabledCompanies?: string[] | null
  shippingPrices?: ShippingPrices | null
  onSubmit: (data: ShippingFormData) => void
}

export default function ShippingForm({ defaultValues, enabledCompanies, shippingPrices, onSubmit }: Props) {
  const visibleCompanies = enabledCompanies && enabledCompanies.length > 0
    ? COMPANIES.filter((c) => enabledCompanies.includes(c.id))
    : COMPANIES

  // Only show municipalities that have a configured delivery price
  const availableMunicipalities = shippingPrices?.delivery
    ? CARABOBO_MUNICIPALITIES.filter((m) => (shippingPrices.delivery[m] ?? 0) > 0)
    : CARABOBO_MUNICIPALITIES
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      delivery_type: (defaultValues?.delivery_type as 'home' | 'office' | 'store' | undefined) ?? 'office',
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      state: defaultValues?.state ?? defaultValues?.department ?? '',
      city: defaultValues?.city ?? '',
      address_line: defaultValues?.address_line ?? '',
      postal_code: defaultValues?.postal_code ?? '',
      notes: defaultValues?.notes ?? '',
      shipping_company: defaultValues?.shipping_company ?? '',
      office: defaultValues?.office ?? '',
    },
  })

  const deliveryType = watch('delivery_type')
  const selectedCompany = watch('shipping_company')

  useEffect(() => {
    if (deliveryType === 'home') {
      setValue('state', 'Carabobo', { shouldValidate: false })
    }
  }, [deliveryType, setValue])

  function handleValid(raw: FormValues) {
    const companyLabel = COMPANIES.find((c) => c.id === raw.shipping_company)?.label ?? raw.shipping_company ?? ''
    const address_line =
      raw.delivery_type === 'office'
        ? `Agencia ${companyLabel} · ${(raw.office ?? '').trim()}`
        : raw.delivery_type === 'store'
        ? 'Retiro en tienda'
        : (raw.address_line ?? '').trim()

    onSubmit({
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      address_line,
      city: raw.city ?? '',
      department: raw.state ?? '',
      state: raw.state ?? '',
      postal_code: raw.postal_code,
      notes: raw.notes,
      delivery_type: raw.delivery_type,
      shipping_company: raw.shipping_company,
      office: raw.office,
    })
  }

  const inp = (hasError: boolean) =>
    cn(
      'w-full border rounded px-4 py-3 text-sm focus:outline-none transition-colors',
      hasError ? 'border-sale focus:border-sale' : 'border-gray-light focus:border-black',
    )

  return (
    <form onSubmit={handleSubmit(handleValid)} className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-bold">Información de envío</h2>

      {/* ── Delivery type selector ─────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-heading font-semibold uppercase tracking-wider text-gray-text mb-3">
          ¿Cómo deseas recibir tu pedido?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Office option */}
          <button
            type="button"
            onClick={() => setValue('delivery_type', 'office', { shouldValidate: true })}
            className={cn(
              'flex items-start gap-3 border-2 rounded-lg px-4 py-4 text-left transition-colors',
              deliveryType === 'office' ? 'border-black bg-white' : 'border-gray-light hover:border-gray-text/50',
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
              deliveryType === 'office' ? 'border-black' : 'border-gray-light',
            )}>
              {deliveryType === 'office' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
            </div>
            <div>
              <p className="text-sm font-heading font-semibold">Oficina de paquetería</p>
              <p className="text-xs text-gray-text mt-0.5">Retiras en una agencia Zoom, Tealca o MRW</p>
            </div>
          </button>

          {/* Home option */}
          <button
            type="button"
            onClick={() => setValue('delivery_type', 'home', { shouldValidate: true })}
            className={cn(
              'flex items-start gap-3 border-2 rounded-lg px-4 py-4 text-left transition-colors',
              deliveryType === 'home' ? 'border-black bg-white' : 'border-gray-light hover:border-gray-text/50',
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
              deliveryType === 'home' ? 'border-black' : 'border-gray-light',
            )}>
              {deliveryType === 'home' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
            </div>
            <div>
              <p className="text-sm font-heading font-semibold">Dirección particular</p>
              <p className="text-xs text-gray-text mt-0.5">Delivery solo disponible en Valencia</p>
            </div>
          </button>

          {/* Store option */}
          <button
            type="button"
            onClick={() => setValue('delivery_type', 'store', { shouldValidate: true })}
            className={cn(
              'flex items-start gap-3 border-2 rounded-lg px-4 py-4 text-left transition-colors',
              deliveryType === 'store' ? 'border-black bg-white' : 'border-gray-light hover:border-gray-text/50',
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
              deliveryType === 'store' ? 'border-black' : 'border-gray-light',
            )}>
              {deliveryType === 'store' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
            </div>
            <div>
              <p className="text-sm font-heading font-semibold">Retiro en tienda</p>
              <p className="text-xs text-gray-text mt-0.5">Retiras y pagas directamente en nuestra tienda</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Contact info (always shown) ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre completo" error={errors.name?.message} className="sm:col-span-2">
          <input {...register('name')} placeholder="María García" className={inp(!!errors.name)} />
        </Field>

        <Field label="Correo electrónico" error={errors.email?.message}>
          <input {...register('email')} type="email" placeholder="correo@ejemplo.com" className={inp(!!errors.email)} />
        </Field>

        <Field label="Teléfono / WhatsApp" error={errors.phone?.message}>
          <input {...register('phone')} type="tel" placeholder="+58 414 123 4567" className={inp(!!errors.phone)} />
        </Field>
      </div>

      {/* ── Office delivery fields ────────────────────────────────────────── */}
      {deliveryType === 'office' && (
        <div className="border border-gray-light rounded-lg p-4 space-y-4 bg-gray-bg/40">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
            Datos de la agencia
          </p>

          {/* Company selector */}
          <div>
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-gray-text mb-2">
              Empresa de envío *
            </p>
            <div className="grid grid-cols-3 gap-2">
              {visibleCompanies.map((c) => {
                const isFree = shippingPrices?.agency?.[c.id] === 0
                const isSelected = selectedCompany === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue('shipping_company', c.id, { shouldValidate: true })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-3 rounded border-2 text-sm font-heading font-semibold transition-colors',
                      isSelected
                        ? 'border-black bg-black text-white'
                        : isFree
                        ? 'border-green-500 hover:border-green-600 text-black'
                        : 'border-gray-light hover:border-gray-text/50 text-black',
                    )}
                  >
                    {c.label}
                    {isFree && (
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                        isSelected ? 'bg-green-400 text-green-900' : 'bg-green-100 text-green-700',
                      )}>
                        ¡GRATIS!
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {errors.shipping_company && (
              <p className="text-xs text-sale mt-1">{errors.shipping_company.message}</p>
            )}
          </div>

          {/* State + city */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Estado *" error={errors.state?.message}>
              <select {...register('state')} className={inp(!!errors.state)}>
                <option value="">Selecciona tu estado</option>
                {VE_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Ciudad *" error={errors.city?.message}>
              <input {...register('city')} placeholder="Caracas" className={inp(!!errors.city)} />
            </Field>
          </div>

          {/* Office description */}
          <Field label="Agencia / referencia *" error={errors.office?.message}>
            <input
              {...register('office')}
              placeholder="Ej: MRW Chacaíto, Av. Lincoln local 4"
              className={inp(!!errors.office)}
            />
            <p className="text-[11px] text-gray-text mt-1">
              Escribe el nombre o dirección de la agencia más cercana a ti.
            </p>
          </Field>
        </div>
      )}

      {/* ── Home delivery fields ──────────────────────────────────────────── */}
      {deliveryType === 'home' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Dirección *" error={errors.address_line?.message} className="sm:col-span-2">
            <input
              {...register('address_line')}
              placeholder="Av. Principal, Edificio Torres, Piso 3, Apto 3-B"
              className={inp(!!errors.address_line)}
            />
          </Field>

          <Field label="Municipio *" error={errors.city?.message} className="sm:col-span-2">
            <select {...register('city')} className={inp(!!errors.city)}>
              <option value="">Selecciona tu municipio</option>
              {availableMunicipalities.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Código postal" error={errors.postal_code?.message}>
            <input {...register('postal_code')} placeholder="2001 (opcional)" className={inp(!!errors.postal_code)} />
          </Field>
        </div>
      )}

      {/* ── Store pickup info ─────────────────────────────────────────────── */}
      {deliveryType === 'store' && (
        <div className="border border-gray-light rounded-lg p-4 bg-gray-bg/40 text-sm text-gray-text">
          <p className="font-heading font-semibold text-black mb-1">Retiro en tienda</p>
          <p>Al confirmar tu pedido recibirás un enlace de WhatsApp para coordinar el horario de retiro y realizar el pago directamente en nuestra tienda.</p>
        </div>
      )}

      {/* ── Notes ────────────────────────────────────────────────────────── */}
      <Field label="Notas adicionales (opcional)" error={errors.notes?.message}>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Instrucciones de entrega, referencias, etc."
          className={cn(inp(!!errors.notes), 'resize-none')}
        />
      </Field>

      <button
        type="submit"
        className="w-full py-4 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors mt-1"
      >
        CONTINUAR →
      </button>
    </form>
  )
}

// ─── Field helper (outside component — stable identity) ───────────────────────

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-xs font-heading font-semibold uppercase tracking-wider text-gray-text">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-sale">{error}</p>}
    </div>
  )
}
