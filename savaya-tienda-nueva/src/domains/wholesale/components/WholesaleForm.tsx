'use client'

import { useState, useTransition } from 'react'
import { WholesaleLeadSchema, type WholesaleLeadInput } from '../validators'
import { submitWholesaleLead } from '../actions'
import { Button } from '@/shared/ui/Button'

type FormErrors = Partial<Record<keyof WholesaleLeadInput, string>>

const emptyForm: WholesaleLeadInput = {
  contactName: '',
  businessName: '',
  city: '',
  whatsapp: '',
  email: '',
  estimatedMonthlyVolume: '',
  message: '',
}

const VOLUME_OPTIONS = [
  'Menos de 20 pares/mes',
  '20–50 pares/mes',
  '50–100 pares/mes',
  'Más de 100 pares/mes',
]

export function WholesaleForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<WholesaleLeadInput>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [whatsappUrl, setWhatsappUrl] = useState('')

  function field(key: keyof WholesaleLeadInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = WholesaleLeadSchema.safeParse(form)
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof WholesaleLeadInput
        if (k && !errs[k]) errs[k] = issue.message
      }
      setErrors(errs)
      return
    }

    startTransition(async () => {
      const res = await submitWholesaleLead(result.data)
      if (res.success) {
        setWhatsappUrl(res.data.whatsappUrl)
      } else {
        if (res.fieldErrors) {
          const errs: FormErrors = {}
          for (const [k, msgs] of Object.entries(res.fieldErrors)) {
            errs[k as keyof WholesaleLeadInput] = msgs[0]
          }
          setErrors(errs)
        }
      }
    })
  }

  if (whatsappUrl) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-4">
        <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-medium text-lg">¡Solicitud recibida!</h3>
        <p className="text-text-secondary text-sm">
          Continúa la conversación en WhatsApp para coordinar los detalles.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-medium hover:bg-[#1ebe5d] transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Continuar en WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Tu nombre" error={errors.contactName}>
          <input
            value={form.contactName}
            onChange={(e) => field('contactName', e.target.value)}
            placeholder="Nombre completo"
            className={inputClass(!!errors.contactName)}
          />
        </FormField>
        <FormField label="Nombre del negocio" error={errors.businessName}>
          <input
            value={form.businessName}
            onChange={(e) => field('businessName', e.target.value)}
            placeholder="Tienda, empresa..."
            className={inputClass(!!errors.businessName)}
          />
        </FormField>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Ciudad" error={errors.city}>
          <input
            value={form.city}
            onChange={(e) => field('city', e.target.value)}
            placeholder="Valencia, Caracas..."
            className={inputClass(!!errors.city)}
          />
        </FormField>
        <FormField label="WhatsApp" error={errors.whatsapp}>
          <input
            value={form.whatsapp}
            onChange={(e) => field('whatsapp', e.target.value)}
            type="tel"
            placeholder="0414 1234567"
            className={inputClass(!!errors.whatsapp)}
          />
        </FormField>
      </div>

      <FormField label="Correo electrónico (opcional)" error={errors.email}>
        <input
          value={form.email ?? ''}
          onChange={(e) => field('email', e.target.value)}
          type="email"
          className={inputClass(!!errors.email)}
        />
      </FormField>

      <FormField label="Volumen estimado mensual" error={errors.estimatedMonthlyVolume}>
        <select
          value={form.estimatedMonthlyVolume ?? ''}
          onChange={(e) => field('estimatedMonthlyVolume', e.target.value)}
          className={inputClass(false)}
        >
          <option value="">Selecciona una opción</option>
          {VOLUME_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Mensaje adicional (opcional)" error={errors.message}>
        <textarea
          value={form.message ?? ''}
          onChange={(e) => field('message', e.target.value)}
          rows={3}
          placeholder="Cuéntanos sobre tu negocio..."
          className={`${inputClass(false)} resize-none`}
        />
      </FormField>

      <Button type="submit" isLoading={isPending} className="w-full">
        Enviar solicitud
      </Button>
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
  return `w-full border ${hasError ? 'border-error' : 'border-border'} rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold transition-colors`
}
