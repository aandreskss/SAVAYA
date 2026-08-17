'use client'

import { useState, useTransition } from 'react'
import { AddressSchema, type AddressInput } from '../validators'
import { createAddress, updateAddress } from '../actions'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { toast } from '@/shared/ui/toast-store'
import type { CustomerAddress } from '../types'

const VE_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
  'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Falcón',
  'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas',
  'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo',
  'La Guaira', 'Yaracuy', 'Zulia', 'Distrito Capital',
]

type FormErrors = Partial<Record<keyof AddressInput, string>>

function emptyForm(): AddressInput {
  return {
    label: 'casa',
    recipientName: '',
    state: '',
    city: '',
    municipality: '',
    parish: '',
    address: '',
    reference: '',
    isDefault: false,
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  address?: CustomerAddress
}

export function AddressFormModal({ isOpen, onClose, onSuccess, address }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!address

  const [form, setForm] = useState<AddressInput>(
    address
      ? {
          label: address.label,
          recipientName: address.recipientName,
          state: address.state,
          city: address.city,
          municipality: address.municipality,
          parish: address.parish ?? '',
          address: address.address,
          reference: address.reference ?? '',
          isDefault: address.isDefault,
        }
      : emptyForm(),
  )
  const [errors, setErrors] = useState<FormErrors>({})

  function field(key: keyof AddressInput, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleClose() {
    if (!isEditing) setForm(emptyForm())
    setErrors({})
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = AddressSchema.safeParse(form)
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof AddressInput
        if (k && !errs[k]) errs[k] = issue.message
      }
      setErrors(errs)
      return
    }

    startTransition(async () => {
      const res = isEditing
        ? await updateAddress(address.id, result.data)
        : await createAddress(result.data)

      if (res.success) {
        toast.success(isEditing ? 'Dirección actualizada.' : 'Dirección guardada.')
        if (!isEditing) setForm(emptyForm())
        setErrors({})
        onSuccess()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar dirección' : 'Nueva dirección'}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-2">
        {/* Label */}
        <FormField label="Etiqueta" error={errors.label}>
          <input
            value={form.label}
            onChange={(e) => field('label', e.target.value)}
            placeholder="ej. casa, oficina"
            className={inputClass(!!errors.label)}
          />
        </FormField>

        {/* Recipient */}
        <FormField label="Destinatario" error={errors.recipientName}>
          <input
            value={form.recipientName}
            onChange={(e) => field('recipientName', e.target.value)}
            placeholder="Nombre completo"
            autoComplete="name"
            className={inputClass(!!errors.recipientName)}
          />
        </FormField>

        {/* State */}
        <FormField label="Estado" error={errors.state}>
          <select
            value={form.state}
            onChange={(e) => field('state', e.target.value)}
            className={inputClass(!!errors.state)}
          >
            <option value="">Selecciona un estado</option>
            {VE_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FormField>

        {/* City + Municipality */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ciudad" error={errors.city}>
            <input
              value={form.city}
              onChange={(e) => field('city', e.target.value)}
              className={inputClass(!!errors.city)}
            />
          </FormField>
          <FormField label="Municipio" error={errors.municipality}>
            <input
              value={form.municipality}
              onChange={(e) => field('municipality', e.target.value)}
              className={inputClass(!!errors.municipality)}
            />
          </FormField>
        </div>

        {/* Parish */}
        <FormField label="Parroquia (opcional)">
          <input
            value={form.parish ?? ''}
            onChange={(e) => field('parish', e.target.value)}
            className={inputClass(false)}
          />
        </FormField>

        {/* Address */}
        <FormField label="Dirección" error={errors.address}>
          <input
            value={form.address}
            onChange={(e) => field('address', e.target.value)}
            placeholder="Calle, edificio, número..."
            className={inputClass(!!errors.address)}
          />
        </FormField>

        {/* Reference */}
        <FormField label="Referencia (opcional)">
          <input
            value={form.reference ?? ''}
            onChange={(e) => field('reference', e.target.value)}
            placeholder="Color de fachada, cerca de..."
            className={inputClass(false)}
          />
        </FormField>

        {/* Default */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => field('isDefault', e.target.checked)}
            className="w-4 h-4 accent-accent-gold"
          />
          <span className="text-sm">Usar como dirección principal</span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending} className="flex-1">
            {isEditing ? 'Guardar cambios' : 'Agregar dirección'}
          </Button>
        </div>
      </form>
    </Modal>
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
