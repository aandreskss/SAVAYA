'use client'

import { useState, useRef } from 'react'
import { useCheckoutStore } from '../checkout-store'
import { useCartStore } from '@/domains/cart/cart-store'
import { PaymentDataSchema } from '../validators'
import { submitOrder } from '../actions'
import type { PaymentMethodOption, PartialPaymentType, PaymentData } from '../types'

const PARTIAL_LABELS: Record<PartialPaymentType, string> = {
  full: 'Pago completo (100%)',
  partial_20: 'Adelanto 20% — saldo contra entrega',
  partial_35: 'Adelanto 35% — saldo contra entrega',
  partial_50: 'Adelanto 50% — saldo contra entrega',
}

type Props = {
  paymentMethods: PaymentMethodOption[]
  partialPaymentOptions: number[]
  totalUsd: number
  exchangeRate: number
}

export function StepPayment({ paymentMethods, partialPaymentOptions, totalUsd, exchangeRate }: Props) {
  const {
    paymentData,
    setPaymentData,
    setOrderResult,
    setSubmitting,
    setSubmitError,
    isSubmitting,
    submitError,
    goBack,
    personalData,
    shippingData,
    shippingCostUsd,
    idempotencyKey,
    appliedCoupon,
  } = useCheckoutStore()
  const clearCart = useCartStore((s) => s.clearCart)

  const [selectedMethodId, setSelectedMethodId] = useState(paymentData?.methodId ?? '')
  const [partialType, setPartialType] = useState<PartialPaymentType>(
    paymentData?.partialPaymentType ?? 'full',
  )
  const [reference, setReference] = useState(paymentData?.reference ?? '')
  const [amountPaid, setAmountPaid] = useState(paymentData?.amountPaid ?? '')
  const [paymentDate, setPaymentDate] = useState(
    paymentData?.paymentDate ?? new Date().toISOString().split('T')[0],
  )
  const [holderName, setHolderName] = useState(paymentData?.holderName ?? '')
  const [bankName, setBankName] = useState(paymentData?.bankName ?? '')
  const [bankPhone, setBankPhone] = useState(paymentData?.bankPhone ?? '')
  const [clientId, setClientId] = useState(paymentData?.clientId ?? '')
  const [transactionHash, setTransactionHash] = useState(paymentData?.transactionHash ?? '')
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(paymentData?.cloudinaryPublicId ?? '')
  const [cloudinaryUrl, setCloudinaryUrl] = useState(paymentData?.cloudinaryUrl ?? '')
  const [proofFileName, setProofFileName] = useState(paymentData?.proofFileName ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId)
  const isCash = selectedMethod?.type === 'cash'
  const isVes = selectedMethod?.currency === 'ves'

  const partialMultiplier =
    partialType === 'partial_20' ? 0.2
    : partialType === 'partial_35' ? 0.35
    : partialType === 'partial_50' ? 0.5
    : 1.0

  const amountToPayUsd = totalUsd * partialMultiplier
  const amountToPayBs = amountToPayUsd * exchangeRate

  const allPartialOptions: PartialPaymentType[] = [
    'full',
    ...partialPaymentOptions.map((p) => `partial_${p}` as PartialPaymentType),
  ]

  // ── Cloudinary proof upload ─────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate MIME on frontend (server also validates)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Solo se permiten imágenes (JPG, PNG, WebP) o PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('El archivo no puede superar 10 MB.')
      return
    }

    setUploadError(null)
    setUploadProgress(0)

    try {
      // Get signed upload params from our API
      const sigRes = await fetch('/api/checkout/upload-signature')
      if (!sigRes.ok) throw new Error('No se pudo obtener la firma de upload.')
      const { signature, timestamp, cloudName, apiKey, folder, publicId } = await sigRes.json()

      // Upload directly to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('signature', signature)
      formData.append('timestamp', String(timestamp))
      formData.append('api_key', apiKey)
      formData.append('folder', folder)
      formData.append('public_id', publicId)
      formData.append('type', 'private')

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData },
      )

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err?.error?.message ?? 'Error al subir el comprobante.')
      }

      const data = await uploadRes.json()
      setCloudinaryPublicId(data.public_id)
      setCloudinaryUrl(data.secure_url)
      setProofFileName(file.name)
      setUploadProgress(100)
      if (errors.cloudinaryPublicId) {
        setErrors((prev) => ({ ...prev, cloudinaryPublicId: undefined as unknown as string }))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir el archivo.')
      setUploadProgress(null)
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedMethod) return

    const formPaymentData: PaymentData = {
      methodId: selectedMethodId,
      methodType: selectedMethod.type,
      methodCurrency: selectedMethod.currency,
      partialPaymentType: partialType,
      reference,
      amountPaid,
      paymentDate,
      holderName,
      bankName: bankName || undefined,
      bankPhone: bankPhone || undefined,
      clientId: clientId || undefined,
      transactionHash: transactionHash || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
      cloudinaryUrl: cloudinaryUrl || undefined,
      proofFileName: proofFileName || undefined,
    }

    const validation = PaymentDataSchema.safeParse(formPaymentData)
    if (!validation.success) {
      const errs: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string
        if (field && !errs[field]) errs[field] = issue.message
      }
      setErrors(errs)
      return
    }

    setErrors({})
    setPaymentData(formPaymentData)
    setSubmitting(true)
    setSubmitError(null)

    // cartId is read server-side from the HttpOnly cookie — client never touches it
    const result = await submitOrder({
      personalData: personalData!,
      shippingData: shippingData!,
      paymentData: formPaymentData,
      shippingCostUsd,
      exchangeRate,
      idempotencyKey,
      couponCode: appliedCoupon?.code,
    })

    setSubmitting(false)

    if (result.success) {
      clearCart()
      setOrderResult(result.data)
    } else {
      setSubmitError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-text-primary">
        Método de pago
      </h2>

      {/* Total summary */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-accent-gold-soft)] px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-secondary)]">Total a pagar</span>
          <span className="font-semibold">${totalUsd.toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
          <span>Equivalente en Bs.</span>
          <span>Bs. {(totalUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Partial payment options */}
      {allPartialOptions.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">¿Cuánto deseas pagar ahora?</p>
          {allPartialOptions.map((opt) => (
            <label
              key={opt}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border p-3',
                partialType === opt
                  ? 'border-accent-gold bg-[var(--color-accent-gold-soft)]'
                  : 'border-[var(--color-border)]',
              ].join(' ')}
            >
              <input
                type="radio"
                name="partialType"
                value={opt}
                checked={partialType === opt}
                onChange={() => setPartialType(opt)}
                className="mt-0.5 accent-accent-gold"
              />
              <div className="flex-1 text-sm">
                <p className="font-medium">{PARTIAL_LABELS[opt]}</p>
                {opt !== 'full' && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Adelanto: ${(totalUsd * (parseInt(opt.split('_')[1]) / 100)).toFixed(2)} USD
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Payment method cards */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Selecciona cómo pagar</p>
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => {
              setSelectedMethodId(method.id)
              setErrors({})
            }}
            className={[
              'flex w-full items-start gap-3 rounded-[var(--radius-sm)] border p-3 text-left',
              selectedMethodId === method.id
                ? 'border-accent-gold bg-[var(--color-accent-gold-soft)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]',
            ].join(' ')}
            aria-pressed={selectedMethodId === method.id}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{method.name}</p>
                <span className={[
                  'text-xs rounded-full px-2 py-0.5',
                  method.currency === 'usd'
                    ? 'bg-success/15 text-success'
                    : 'bg-[#3B82F6]/15 text-[#60A5FA]',
                ].join(' ')}>
                  {method.currency === 'usd' ? 'USD' : 'Bs.'}
                </span>
              </div>
              {method.instructions && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2">
                  {method.instructions}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Method-specific instructions + form */}
      {selectedMethod && (
        <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          {/* Account details */}
          {selectedMethod.accountDetails && Object.keys(selectedMethod.accountDetails).length > 0 && (
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-accent-gold-soft)] p-3 text-sm space-y-1">
              <p className="font-semibold">Datos para el pago</p>
              {Object.entries(selectedMethod.accountDetails).map(([k, v]) => (
                <p key={k} className="text-[var(--color-text-secondary)]">
                  <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>:{' '}
                  <span className="font-medium text-text-primary">{v}</span>
                </p>
              ))}
            </div>
          )}

          {/* Amount to pay */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Monto a pagar</span>
            <span className="font-bold text-base">
              {isVes
                ? `Bs. ${amountToPayBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                : `$${amountToPayUsd.toFixed(2)}`}
            </span>
          </div>

          {/* Non-cash: declaration fields */}
          {!isCash && (
            <div className="space-y-3">
              {/* Reference */}
              <TextField
                id="reference"
                label="Referencia del pago"
                value={reference}
                onChange={setReference}
                error={errors.reference}
                placeholder="Número de confirmación"
              />

              {/* Amount paid */}
              <TextField
                id="amountPaid"
                label={`Monto pagado (${isVes ? 'Bs.' : 'USD'})`}
                type="number"
                value={amountPaid}
                onChange={setAmountPaid}
                error={errors.amountPaid}
                placeholder={isVes ? 'Ej. 1250.00' : 'Ej. 45.00'}
              />

              {/* Payment date */}
              <TextField
                id="paymentDate"
                label="Fecha del pago"
                type="date"
                value={paymentDate}
                onChange={setPaymentDate}
                error={errors.paymentDate}
              />

              {/* Holder name */}
              <TextField
                id="holderName"
                label="Nombre del titular de la cuenta"
                value={holderName}
                onChange={setHolderName}
                error={errors.holderName}
              />

              {/* Pago Móvil specific */}
              {selectedMethod.type === 'pago_movil' && (
                <>
                  <TextField
                    id="bankName"
                    label="Banco origen"
                    value={bankName}
                    onChange={setBankName}
                    error={errors.bankName}
                    placeholder="Ej. Banesco, BDV, Mercantil..."
                  />
                  <TextField
                    id="bankPhone"
                    label="Teléfono desde el que pagaste"
                    type="tel"
                    value={bankPhone}
                    onChange={setBankPhone}
                    error={errors.bankPhone}
                    placeholder="04141234567"
                  />
                  <TextField
                    id="clientId"
                    label="Tu cédula de identidad"
                    value={clientId}
                    onChange={setClientId}
                    error={errors.clientId}
                    placeholder="V-12345678"
                  />
                </>
              )}

              {/* Bank transfer specific */}
              {selectedMethod.type === 'bank_transfer' && (
                <TextField
                  id="bankName"
                  label="Banco de origen"
                  value={bankName}
                  onChange={setBankName}
                  error={errors.bankName}
                  placeholder="Ej. Banesco, BDV..."
                />
              )}

              {/* USDT specific */}
              {selectedMethod.type === 'usdt_trc20' && (
                <TextField
                  id="transactionHash"
                  label="Hash de la transacción"
                  value={transactionHash}
                  onChange={setTransactionHash}
                  error={errors.transactionHash}
                  placeholder="0x..."
                />
              )}

              {/* Proof upload */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Comprobante de pago</p>
                <div
                  className={[
                    'relative flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed p-6 text-center transition-colors',
                    cloudinaryPublicId
                      ? 'border-[var(--color-success)] bg-success/10'
                      : errors.cloudinaryPublicId
                        ? 'border-[var(--color-error)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]',
                  ].join(' ')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const dt = e.dataTransfer
                    if (dt?.files[0]) {
                      const input = fileInputRef.current
                      if (input) {
                        const dataTransfer = new DataTransfer()
                        dataTransfer.items.add(dt.files[0])
                        input.files = dataTransfer.files
                        input.dispatchEvent(new Event('change', { bubbles: true }))
                      }
                    }
                  }}
                >
                  {cloudinaryPublicId ? (
                    <div className="space-y-1">
                      <svg className="mx-auto h-8 w-8 text-[var(--color-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium text-[var(--color-success)]">Comprobante cargado</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{proofFileName}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCloudinaryPublicId('')
                          setCloudinaryUrl('')
                          setProofFileName('')
                          setUploadProgress(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="text-xs underline text-[var(--color-text-secondary)]"
                      >
                        Cambiar archivo
                      </button>
                    </div>
                  ) : uploadProgress !== null ? (
                    <div className="space-y-2 w-full">
                      <p className="text-sm text-[var(--color-text-secondary)]">Subiendo...</p>
                      <div className="h-1.5 w-full rounded-full bg-[var(--color-border)]">
                        <div
                          className="h-1.5 rounded-full bg-[var(--color-accent-gold)] transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm font-medium">Arrastra aquí o</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 text-sm underline"
                      >
                        selecciona tu archivo
                      </button>
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                        JPG, PNG, WebP o PDF — máx. 10 MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                    aria-label="Subir comprobante de pago"
                  />
                </div>
                {(uploadError || errors.cloudinaryPublicId) && (
                  <p role="alert" className="text-xs text-[var(--color-error)]">
                    {uploadError ?? errors.cloudinaryPublicId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cash: no proof, just info */}
          {isCash && (
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-accent-gold-soft)] p-3 text-sm">
              <p>Pagarás al retirar en la tienda. No necesitas subir comprobante ahora.</p>
            </div>
          )}
        </div>
      )}

      {/* Global submit error */}
      {submitError && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-error/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {submitError}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={goBack} className="btn-secondary flex-1" disabled={isSubmitting}>
          Volver
        </button>
        <button
          type="submit"
          disabled={!selectedMethodId || isSubmitting}
          className="btn-primary flex-[2] disabled:opacity-50"
        >
          {isSubmitting ? 'Procesando...' : 'Confirmar pedido'}
        </button>
      </div>
    </form>
  )
}

// ── TextField helper ──────────────────────────────────────────────────────────

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  placeholder?: string
}

function TextField({ id, label, value, onChange, error, type = 'text', placeholder }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input ${error ? 'border-[var(--color-error)]' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  )
}
