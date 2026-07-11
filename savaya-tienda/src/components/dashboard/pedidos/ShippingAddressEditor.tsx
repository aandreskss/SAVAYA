'use client'

import { useState, useTransition } from 'react'
import { updateOrderContact } from './shipping-actions'

interface ShippingAddress {
  name: string
  address_line: string
  city: string
  department: string | null
  postal_code: string | null
  phone: string | null
}

interface Props {
  orderId: string
  email: string
  shippingAddress: ShippingAddress
  trackingNumber: string | null
  onSaved?: (name: string, phone: string) => void
}

export default function ShippingAddressEditor({ orderId, email, shippingAddress, trackingNumber, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const initial = {
    email,
    name: shippingAddress.name,
    phone: shippingAddress.phone ?? '',
    address_line: shippingAddress.address_line,
    city: shippingAddress.city,
    department: shippingAddress.department ?? '',
    postal_code: shippingAddress.postal_code ?? '',
  }

  const [form, setForm] = useState(initial)

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function cancel() {
    setForm(initial)
    setError('')
    setEditing(false)
  }

  function save() {
    setError('')
    startTransition(async () => {
      const result = await updateOrderContact(orderId, form)
      if ('error' in result) {
        setError(result.error ?? 'Error al guardar')
      } else {
        setEditing(false)
        onSaved?.(form.name.trim(), form.phone.trim())
      }
    })
  }

  // ── View mode ─────────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="bg-white rounded border border-gray-light p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-heading font-semibold text-gray-text uppercase tracking-wider">
            Cliente
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-heading font-semibold text-gray-text hover:text-black transition-colors"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536M9 11l6.586-6.586a2 2 0 012.828 2.828L11.828 13.828a2 2 0 01-1.414.586H8v-2.414A2 2 0 018.586 10.5z"
              />
            </svg>
            Editar
          </button>
        </div>

        <dl className="space-y-1.5 text-sm font-body">
          <Row label="Nombre" value={shippingAddress.name} />
          <Row label="Email" value={email} />
          {shippingAddress.phone && <Row label="Teléfono" value={shippingAddress.phone} />}
        </dl>

        <div className="pt-4 border-t border-gray-light">
          <h2 className="text-xs font-heading font-semibold text-gray-text uppercase tracking-wider mb-3">
            Dirección de envío
          </h2>
          <address className="not-italic text-sm font-body text-black space-y-1">
            <p>{shippingAddress.address_line}</p>
            <p>
              {shippingAddress.city}
              {shippingAddress.department && `, ${shippingAddress.department}`}
            </p>
            {shippingAddress.postal_code && (
              <p className="text-gray-text">CP {shippingAddress.postal_code}</p>
            )}
          </address>
        </div>

        {trackingNumber && (
          <div className="pt-4 border-t border-gray-light">
            <p className="text-xs font-heading font-semibold text-gray-text uppercase tracking-wider mb-1.5">
              Número de seguimiento
            </p>
            <p className="text-sm font-heading font-bold text-black">{trackingNumber}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded border border-black p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-heading font-semibold text-black uppercase tracking-wider">
          Editar datos del cliente
        </h2>
        <button onClick={cancel} className="text-xs text-gray-text hover:text-black transition-colors">
          Cancelar
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Nombre completo" value={form.name} onChange={v => set('name', v)} placeholder="María García" />
        <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="cliente@email.com" type="email" />
        <Field label="Teléfono / WhatsApp" value={form.phone} onChange={v => set('phone', v)} placeholder="+58 424 123 4567" />
      </div>

      <div className="pt-3 border-t border-gray-light space-y-3">
        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
          Dirección de envío
        </p>
        <Field label="Dirección" value={form.address_line} onChange={v => set('address_line', v)} placeholder="Calle, número, piso..." />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ciudad" value={form.city} onChange={v => set('city', v)} placeholder="Caracas" />
          <Field label="Depto / Estado" value={form.department} onChange={v => set('department', v)} placeholder="Miranda" />
        </div>
        <Field label="Código postal" value={form.postal_code} onChange={v => set('postal_code', v)} placeholder="1010" />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          disabled={isPending}
          onClick={save}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-heading font-semibold text-xs rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isPending && (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Guardar cambios
        </button>
        <button
          onClick={cancel}
          className="px-4 py-2 border border-gray-light text-xs font-heading font-semibold rounded hover:border-black transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-gray-text w-20 shrink-0">{label}</dt>
      <dd className="text-black font-medium break-all">{value}</dd>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 border border-gray-light rounded px-2.5 text-sm focus:outline-none focus:border-black transition-colors"
      />
    </div>
  )
}
