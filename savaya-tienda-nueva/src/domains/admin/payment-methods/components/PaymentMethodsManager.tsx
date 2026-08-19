'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { Modal } from '@/shared/ui/Modal'
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  togglePaymentMethodAction,
  deletePaymentMethodAction,
} from '../actions'
import type { AdminPaymentMethod, PaymentMethodType, PaymentCurrency } from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<PaymentMethodType, string> = {
  zelle: 'Zelle',
  pago_movil: 'Pago Móvil',
  pago_movil_qr: 'Pago Móvil QR',
  bank_transfer: 'Transferencia',
  usdt_trc20: 'USDT TRC-20',
  binance_pay: 'Binance Pay',
  cash: 'Efectivo',
}

const TYPE_COLORS: Record<PaymentMethodType, string> = {
  zelle: 'bg-purple-500/20 text-purple-300',
  pago_movil: 'bg-blue-500/20 text-blue-300',
  pago_movil_qr: 'bg-indigo-500/20 text-indigo-300',
  bank_transfer: 'bg-surface-2 text-text-secondary',
  usdt_trc20: 'bg-teal-500/20 text-teal-300',
  binance_pay: 'bg-yellow-500/20 text-yellow-300',
  cash: 'bg-green-500/20 text-green-300',
}

const BANK_OPTIONS_PRESET = [
  'Banesco',
  'Banco de Venezuela (BDV)',
  'Banco Provincial (BBVA)',
  'Mercantil',
  'Bancamiga',
  'BOD (Banco Occidental de Descuento)',
  'Bancaribe',
  'BNC (Banco Nacional de Crédito)',
  'Banco Exterior',
  'Banplus',
  'Venezolano de Crédito',
  'Fondo Común',
  'Sofitasa',
  'Bancrecer',
  'Activo',
  'Banfanb',
  'Bicentenario del Pueblo',
  'Del Tesoro',
  'Mi Banco',
  'Plaza',
  '100% Banco',
  'Bangente',
]

const BANK_OPTIONS_PRESET_SET = new Set(BANK_OPTIONS_PRESET)

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold'

const selectCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold cursor-pointer'

const labelCls = 'block text-xs font-medium text-text-secondary mb-1'

// ---------------------------------------------------------------------------
// Account summary for table row
// ---------------------------------------------------------------------------

function accountSummary(method: AdminPaymentMethod): string {
  const d = method.accountDetails as Record<string, string> | null
  if (!d) return '—'
  switch (method.type) {
    case 'zelle': return d.email ?? '—'
    case 'pago_movil': return d.phone ?? '—'
    case 'pago_movil_qr': return d.qrImageUrl ? 'QR cargado' : (d.phone ?? '—')
    case 'bank_transfer': {
      const num = d.accountNumber ?? ''
      return num.length > 4 ? `••• ${num.slice(-4)}` : num || '—'
    }
    case 'usdt_trc20': {
      const w = d.walletAddress ?? ''
      return w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w || '—'
    }
    case 'binance_pay': return d.binanceId ?? '—'
    case 'cash': return 'Solo efectivo'
  }
}

// ---------------------------------------------------------------------------
// BankSelector — dropdown with "Otro" free-text fallback
// ---------------------------------------------------------------------------

function BankSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const isPreset = BANK_OPTIONS_PRESET_SET.has(value)
  const [mode, setMode] = useState<'select' | 'other'>(() =>
    value && !isPreset ? 'other' : 'select',
  )

  // Reset to 'select' when the parent clears the value (type change)
  useEffect(() => {
    if (!value) setMode('select')
  }, [value])

  const selectValue = mode === 'other' ? '__otro__' : (value || '')

  function handleSelect(selected: string) {
    if (selected === '__otro__') {
      setMode('other')
      onChange('')
    } else {
      setMode('select')
      onChange(selected)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <select
        className={selectCls}
        value={selectValue}
        onChange={(e) => handleSelect(e.target.value)}
      >
        <option value="">Seleccionar banco</option>
        {BANK_OPTIONS_PRESET.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
        <option value="__otro__">Otro</option>
      </select>
      {mode === 'other' && (
        <input
          autoFocus
          className={inputCls}
          value={value}
          placeholder="Nombre del banco"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// QR image upload helper
// ---------------------------------------------------------------------------

async function uploadQrToCloudinary(file: File): Promise<string> {
  const res = await fetch('/api/admin/payment-methods/upload-qr-signature')
  if (!res.ok) throw new Error('Error al obtener firma de upload')
  const { signature, timestamp, cloudName, apiKey, folder, publicId, isDev } =
    (await res.json()) as {
      signature: string
      timestamp: number
      cloudName: string
      apiKey: string
      folder: string
      publicId: string
      isDev?: boolean
    }

  if (isDev) return URL.createObjectURL(file)

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', apiKey)
  body.append('timestamp', String(timestamp))
  body.append('signature', signature)
  body.append('folder', folder)
  body.append('public_id', publicId)

  const upload = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body },
  )
  if (!upload.ok) throw new Error('Error al subir la imagen')
  const data = (await upload.json()) as { secure_url: string }
  return data.secure_url
}

// ---------------------------------------------------------------------------
// PagoMovilQrForm — extracted so useState is always at the top level
// ---------------------------------------------------------------------------

function PagoMovilQrForm({
  value,
  onChange,
}: {
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
}) {
  const [uploading, setUploading] = useState(false)

  function field(key: string, label: string, placeholder?: string, required = true) {
    return (
      <div key={key}>
        <label className={labelCls}>
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <input
          className={inputCls}
          value={value[key] ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        />
      </div>
    )
  }

  async function handleQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadQrToCloudinary(file)
      onChange({ ...value, qrImageUrl: url })
    } catch {
      toast.error('Error al subir la imagen QR')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* QR image */}
      <div>
        <label className={labelCls}>
          Imagen del código QR<span className="text-red-400 ml-0.5">*</span>
        </label>
        {value.qrImageUrl ? (
          <div className="flex items-start gap-3">
            <div className="border border-border rounded-lg overflow-hidden bg-white p-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value.qrImageUrl} alt="QR de pago" className="w-32 h-32 object-contain" />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs text-text-secondary">QR cargado correctamente.</p>
              <label className="cursor-pointer text-xs text-accent-gold hover:text-accent-gold/80 underline underline-offset-2">
                Cambiar imagen
                <input type="file" accept="image/*" className="sr-only" onChange={handleQrFile} disabled={uploading} />
              </label>
              <button
                type="button"
                onClick={() => onChange({ ...value, qrImageUrl: '' })}
                className="text-xs text-red-400 hover:text-red-300 text-left"
              >
                Eliminar QR
              </button>
            </div>
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
              uploading
                ? 'border-accent-gold/50 bg-accent-gold/5'
                : 'border-border hover:border-accent-gold/40 hover:bg-surface-2'
            }`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-6 h-6 text-accent-gold" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-xs text-text-secondary">Subiendo imagen…</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-secondary" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 14h2v2h-2v2h2v2h2v-2h2v-2h-2v-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs text-text-secondary text-center">
                  <span className="text-accent-gold font-medium">Seleccionar imagen</span> o arrastra aquí
                  <br />PNG, JPG — captura del QR de tu banco
                </p>
              </>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handleQrFile} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Account details for reference */}
      <div>
        <p className="text-xs text-text-secondary mb-2">Datos de cuenta (referencia)</p>
        <div className="grid grid-cols-2 gap-3">
          {field('phone', 'Teléfono', '04141234567')}
          {field('cedula', 'Cédula', 'V-12345678')}
          <div>
            <label className={labelCls}>Banco</label>
            <BankSelector
              value={value.bank ?? ''}
              onChange={(v) => onChange({ ...value, bank: v })}
            />
          </div>
          {field('accountHolder', 'Titular', 'Juan Pérez')}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AccountDetailsForm — dynamic fields per type
// ---------------------------------------------------------------------------

function AccountDetailsForm({
  type,
  value,
  onChange,
}: {
  type: PaymentMethodType
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
}) {
  function field(key: string, label: string, placeholder?: string, required = true) {
    return (
      <div key={key}>
        <label className={labelCls}>
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <input
          className={inputCls}
          value={value[key] ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        />
      </div>
    )
  }

  if (type === 'zelle') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {field('email', 'Email Zelle', 'email@example.com')}
        {field('holderName', 'Titular', 'Juan Pérez')}
      </div>
    )
  }

  if (type === 'pago_movil') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {field('phone', 'Teléfono', '04141234567')}
        {field('cedula', 'Cédula', 'V-12345678')}
        <div>
          <label className={labelCls}>Banco<span className="text-red-400 ml-0.5">*</span></label>
          <BankSelector
            value={value.bank ?? ''}
            onChange={(v) => onChange({ ...value, bank: v })}
          />
        </div>
        {field('accountHolder', 'Titular', 'Juan Pérez')}
      </div>
    )
  }

  if (type === 'pago_movil_qr') {
    return <PagoMovilQrForm value={value} onChange={onChange} />
  }

  if (type === 'bank_transfer') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Banco<span className="text-red-400 ml-0.5">*</span></label>
          <BankSelector
            value={value.bank ?? ''}
            onChange={(v) => onChange({ ...value, bank: v })}
          />
        </div>
        {field('accountNumber', 'Número de cuenta', '01020000001234567890')}
        {field('accountHolder', 'Titular', 'Juan Pérez')}
        <div>
          <label className={labelCls}>Tipo de cuenta<span className="text-red-400 ml-0.5">*</span></label>
          <select
            className={selectCls}
            value={value.accountType ?? 'corriente'}
            onChange={(e) => onChange({ ...value, accountType: e.target.value })}
          >
            <option value="corriente">Corriente</option>
            <option value="ahorro">Ahorro</option>
          </select>
        </div>
        {field('rif', 'RIF', 'J-12345678-9')}
      </div>
    )
  }

  if (type === 'usdt_trc20') {
    return (
      <div className="flex flex-col gap-3">
        {field('walletAddress', 'Dirección de wallet', 'TXxx...')}
        <div className="rounded-md bg-teal-500/10 border border-teal-500/20 px-3 py-2 text-xs text-teal-300">
          Red: <span className="font-semibold">TRC-20 (TRON)</span> — Verifica que la dirección sea correcta para esta red.
        </div>
      </div>
    )
  }

  if (type === 'binance_pay') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {field('binanceId', 'Binance ID / Pay ID', '123456789')}
        {field('qrUrl', 'URL del código QR', 'https://...', false)}
      </div>
    )
  }

  if (type === 'cash') {
    return (
      <div className="rounded-md bg-surface-2 border border-border px-3 py-2 text-xs text-text-secondary">
        Efectivo no requiere datos bancarios. Usa el campo de instrucciones para indicar cómo y dónde pagar.
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// MethodModal — create / edit
// ---------------------------------------------------------------------------

function MethodModal({
  method,
  onClose,
  onSaved,
}: {
  method: AdminPaymentMethod | null
  onClose: () => void
  onSaved: (m: AdminPaymentMethod) => void
}) {
  const isEdit = method !== null

  const [name, setName] = useState(method?.name ?? '')
  const [type, setType] = useState<PaymentMethodType>(method?.type ?? 'zelle')
  const [currency, setCurrency] = useState<PaymentCurrency>(method?.currency ?? 'usd')
  const [instructions, setInstructions] = useState(method?.instructions ?? '')
  const [sortOrder, setSortOrder] = useState(method?.sortOrder ?? 0)
  const [accountDetails, setAccountDetails] = useState<Record<string, string>>(
    (method?.accountDetails as Record<string, string>) ?? {},
  )
  const [isPending, startTransition] = useTransition()

  function handleTypeChange(newType: PaymentMethodType) {
    setType(newType)
    setAccountDetails({})
    if (newType === 'pago_movil' || newType === 'pago_movil_qr' || newType === 'bank_transfer') setCurrency('ves')
    else setCurrency('usd')
  }

  function handleSubmit() {
    if (!name.trim()) { toast.error('El nombre es requerido'); return }

    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          type,
          currency,
          instructions: instructions.trim() || null,
          accountDetails: Object.keys(accountDetails).length > 0 ? accountDetails : null,
          sortOrder,
        }

        const res = isEdit
          ? await updatePaymentMethodAction(method.id, payload)
          : await createPaymentMethodAction(payload)

        if (res.success) {
          onSaved(res.data)
          onClose()
          toast.success(isEdit ? 'Método actualizado' : 'Método de pago creado')
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.error('[PaymentMethodsManager] handleSubmit error:', err)
        toast.error('Error inesperado al guardar. Intenta de nuevo.')
      }
    })
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Editar: ${method.name}` : 'Nuevo método de pago'}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className={labelCls}>Nombre visible<span className="text-red-400 ml-0.5">*</span></label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Zelle Personal, Pago Móvil Banesco…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Type — read-only on edit */}
          <div>
            <label className={labelCls}>Tipo</label>
            {isEdit ? (
              <div className="flex items-center h-9 px-3 rounded-md border border-border bg-surface-2 text-sm text-text-secondary">
                {TYPE_LABELS[type]}
              </div>
            ) : (
              <select
                className={selectCls}
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as PaymentMethodType)}
              >
                {(Object.entries(TYPE_LABELS) as [PaymentMethodType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            )}
          </div>

          {/* Currency */}
          <div>
            <label className={labelCls}>Moneda</label>
            <select
              className={selectCls}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as PaymentCurrency)}
            >
              <option value="usd">$ USD (dólar)</option>
              <option value="ves">Bs. VES (bolívares)</option>
            </select>
          </div>
        </div>

        {/* Dynamic account details */}
        <div>
          <p className={labelCls + ' mb-2'}>Datos de la cuenta</p>
          <div className="rounded-md border border-border bg-surface-2 p-4">
            <AccountDetailsForm type={type} value={accountDetails} onChange={setAccountDetails} />
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className={labelCls}>Instrucciones para el cliente (opcional)</label>
          <textarea
            className={inputCls + ' h-20 py-2 resize-none'}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ej: Enviar comprobante con número de pedido en el concepto"
          />
        </div>

        {/* Sort order */}
        <div>
          <label className={labelCls}>Orden de visualización</label>
          <input
            type="number"
            className={inputCls}
            value={sortOrder}
            min={0}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-text-secondary">Número menor = aparece primero en el checkout</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-text-secondary hover:text-text-primary px-4 py-2 rounded-full hover:bg-surface-2 transition-colors"
          >
            Cancelar
          </button>
          <Button isLoading={isPending} onClick={handleSubmit}>
            {isEdit ? 'Guardar cambios' : 'Crear método'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// PaymentMethodsManager
// ---------------------------------------------------------------------------

type Props = {
  initialMethods: AdminPaymentMethod[]
  canEdit: boolean
}

export function PaymentMethodsManager({ initialMethods, canEdit }: Props) {
  const [methods, setMethods] = useState(initialMethods)
  // undefined = modal closed | null = create mode | AdminPaymentMethod = edit mode
  const [modalMethod, setModalMethod] = useState<AdminPaymentMethod | null | undefined>(undefined)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSaved(saved: AdminPaymentMethod) {
    setMethods((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id)
      if (idx === -1) return [...prev, saved].sort((a, b) => a.sortOrder - b.sortOrder)
      const next = [...prev]
      next[idx] = saved
      return next
    })
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      try {
        const res = await togglePaymentMethodAction(id, isActive)
        if (res.success) {
          setMethods((prev) => prev.map((m) => m.id === id ? { ...m, isActive } : m))
          toast.success(isActive ? 'Método activado' : 'Método desactivado')
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.error('[PaymentMethodsManager] handleToggle error:', err)
        toast.error('Error al actualizar el estado.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await deletePaymentMethodAction(id)
        if (res.success) {
          setMethods((prev) => prev.filter((m) => m.id !== id))
          setDeleteConfirmId(null)
          toast.success('Método eliminado')
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.error('[PaymentMethodsManager] handleDelete error:', err)
        toast.error('Error al eliminar el método.')
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Métodos de pago</h1>
          <p className="text-sm text-text-secondary mt-1">
            Configura los métodos disponibles para los clientes en el checkout.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setModalMethod(null)}>+ Agregar método</Button>
        )}
      </div>

      {!canEdit && (
        <div className="border border-border rounded-xl px-5 py-3 mb-6 text-xs text-text-secondary bg-surface/50">
          Vista de solo lectura. Necesitas permiso{' '}
          <span className="font-semibold">settings:write</span> para editar.
        </div>
      )}

      {/* Empty state */}
      {methods.length === 0 && (
        <div className="border border-dashed border-border rounded-2xl py-16 flex flex-col items-center gap-3 text-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-text-secondary" aria-hidden="true">
            <rect x="3" y="9" width="34" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 16h34" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 23h6M25 23h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm font-medium text-text-primary">Sin métodos de pago configurados</p>
          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
            Agrega Zelle, Pago Móvil, transferencia bancaria u otros métodos para que los clientes puedan seleccionarlos en el checkout.
          </p>
          {canEdit && (
            <Button size="sm" onClick={() => setModalMethod(null)}>Crear primer método</Button>
          )}
        </div>
      )}

      {/* Table */}
      {methods.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">
                  Moneda
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden lg:table-cell">
                  Cuenta
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Estado
                </th>
                {canEdit && (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {methods.map((method) => (
                <tr key={method.id} className="bg-surface hover:bg-surface-2/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{method.name}</p>
                    {method.instructions && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                        {method.instructions}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[method.type]}`}
                    >
                      {TYPE_LABELS[method.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-mono text-text-secondary">
                      {method.currency === 'usd' ? '$ USD' : 'Bs. VES'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs font-mono text-text-secondary">{accountSummary(method)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {canEdit ? (
                      <button
                        onClick={() => handleToggle(method.id, !method.isActive)}
                        disabled={isPending}
                        aria-label={method.isActive ? 'Desactivar' : 'Activar'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          method.isActive ? 'bg-accent-gold' : 'bg-border'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                            method.isActive ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    ) : (
                      <span className={`text-xs ${method.isActive ? 'text-green-400' : 'text-text-secondary'}`}>
                        {method.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      {deleteConfirmId === method.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-text-secondary">¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(method.id)}
                            disabled={isPending}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setModalMethod(method)}
                            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(method.id)}
                            className="text-xs text-text-secondary hover:text-red-400 px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalMethod !== undefined && (
        <MethodModal
          method={modalMethod}
          onClose={() => setModalMethod(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
