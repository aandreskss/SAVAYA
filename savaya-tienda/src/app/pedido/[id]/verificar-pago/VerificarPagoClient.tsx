'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { formatPrice, toProxyUrl } from '@/lib/utils'
import { formatBs } from '@/lib/bcvRate'
import type { PaymentConfigDB } from '@/lib/types'
import { submitPaymentProof } from './actions'
import { useCurrency } from '@/components/providers/CurrencyProvider'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIVISA_PAYMENT_METHODS = ['zelle', 'binance', 'usdt']

const PAYMENT_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  binance: 'Binance Pay',
  usdt: 'USDT (TRC20)',
  bank_transfer_ve: 'Transferencia bancaria',
  pago_movil: 'Pago móvil',
  efectivo: 'Efectivo',
}

function getPaymentFields(method: string, config: PaymentConfigDB | null) {
  if (!config) return []
  const filter = (arr: { label: string; value: string | undefined }[]) =>
    arr.filter((f): f is { label: string; value: string } => !!f.value)
  switch (method) {
    case 'zelle':
      return filter([
        { label: 'Titular', value: config.zelle?.titular },
        { label: 'Email / Teléfono', value: config.zelle?.email_phone },
      ])
    case 'binance':
      return filter([{ label: 'Pay ID', value: config.binance?.pay_id }])
    case 'usdt':
      return filter([
        { label: 'Red', value: 'TRC20 (TRON)' },
        { label: 'Dirección', value: config.usdt?.address },
      ])
    case 'bank_transfer_ve':
      return filter([
        { label: 'Banco', value: config.bank_transfer_ve?.banco },
        { label: 'Tipo', value: config.bank_transfer_ve?.tipo },
        { label: 'Número', value: config.bank_transfer_ve?.numero },
        { label: 'Titular', value: config.bank_transfer_ve?.titular },
        { label: 'CI', value: config.bank_transfer_ve?.ci },
      ])
    case 'pago_movil':
      return filter([
        { label: 'Banco', value: config.pago_movil?.banco },
        { label: 'Teléfono', value: config.pago_movil?.telefono },
        { label: 'CI', value: config.pago_movil?.ci },
      ])
    default:
      return []
  }
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return dateStr
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  orderId: string
  orderNumber: string
  total: number
  divisaTotal?: number | null
  amountDue?: number
  reservationPct?: number
  paymentMethod: string
  customerName: string
  storeWhatsapp: string
  paymentConfig: PaymentConfigDB | null
  alreadySubmitted: boolean
  appUrl: string
  bcvRate?: number | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VerificarPagoClient({
  orderId,
  orderNumber,
  total,
  divisaTotal,
  amountDue,
  reservationPct,
  paymentMethod,
  customerName,
  storeWhatsapp,
  paymentConfig,
  alreadySubmitted,
  appUrl,
  bcvRate,
}: Props) {
  const currency = useCurrency()
  const isReservation = !!reservationPct
  const isDivisaMethod = DIVISA_PAYMENT_METHODS.includes(paymentMethod)
  const showDivisa = isDivisaMethod && divisaTotal != null

  // For divisa methods: show divisaTotal; for BCV methods: show the BCV amount
  const displayAmount = amountDue ?? total
  const divisaDisplayAmount = reservationPct ? Math.round((divisaTotal ?? 0) * reservationPct) / 100 : (divisaTotal ?? 0)
  const shownAmount = showDivisa ? divisaDisplayAmount : displayAmount
  const shownCurrency = showDivisa ? 'USD' : currency
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(alreadySubmitted)
  const [waUrl, setWaUrl] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const methodLabel = PAYMENT_LABELS[paymentMethod] || paymentMethod
  const paymentFields = getPaymentFields(paymentMethod, paymentConfig)

  function handleFile(file: File | null) {
    if (!file) return
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setProofPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSend() {
    if (!proofFile && !transactionId.trim() && !paymentDate && !accountHolder.trim()) {
      setError('Por favor completa al menos un campo del formulario.')
      return
    }

    setSending(true)
    setError('')

    try {
      let proofUrl: string | null = null

      if (proofFile) {
        const fd = new FormData()
        fd.append('file', proofFile)
        const res = await fetch('/api/upload?folder=savaya/comprobantes', { method: 'POST', body: fd })
        const data = await res.json() as { url?: string; error?: string }
        if (!res.ok) throw new Error(data.error || 'Error al subir comprobante')
        proofUrl = data.url ?? null
      }

      await submitPaymentProof(orderId, {
        payment_proof_url: proofUrl,
        payment_transaction_id: transactionId.trim() || null,
        payment_date: paymentDate || null,
        payment_account_holder: accountHolder.trim() || null,
      })

      // Build WhatsApp message
      const lines = [
        isReservation
          ? `*Comprobante de apartado ${reservationPct}% — Pedido ${orderNumber}*`
          : `*Comprobante de pago — Pedido ${orderNumber}*`,
        '',
        isReservation ? `→ Monto apartado: ${formatPrice(shownAmount, shownCurrency)} (${reservationPct}% de ${formatPrice(showDivisa ? (divisaTotal ?? 0) : total, shownCurrency)})` : null,
        `→ Método: ${methodLabel}`,
        transactionId.trim() ? `ID de transacción: ${transactionId.trim()}` : null,
        paymentDate ? `Fecha de pago: ${formatDateDisplay(paymentDate)}` : null,
        accountHolder.trim() ? `Titular de la cuenta: ${accountHolder.trim()}` : null,
        proofUrl ? `\nComprobante: ${toProxyUrl(proofUrl)}` : null,
        isReservation ? `\nQuedo atento para coordinar la fecha y hora de retiro y pagar el resto (${formatPrice((showDivisa ? (divisaTotal ?? 0) : total) - shownAmount, shownCurrency)}).` : null,
        `\n→ Gestionar pedido: ${appUrl}/dashboard/pedidos/${orderId}`,
        `_[ENLACE DE USO EXCLUSIVAMENTE ADMINISTRATIVO]_`,
      ].filter(Boolean).join('\n')

      const wa = `https://wa.me/${storeWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(lines)}`
      setWaUrl(wa)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar')
    } finally {
      setSending(false)
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold mb-3">¡Datos guardados!</h1>
        <p className="text-gray-text mb-2">
          Recibimos tu comprobante para el pedido <strong>{orderNumber}</strong>.
        </p>
        <p className="text-gray-text mb-6 text-sm">
          Toca el botón de WhatsApp para notificar a la tienda y agilizar la verificación.
        </p>

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 w-full max-w-xs mx-auto py-4 bg-[#25D366] text-white font-heading font-bold text-sm tracking-wider rounded hover:bg-[#1fb858] transition-colors mb-6"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            ENVIAR POR WHATSAPP
          </a>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-8 py-3.5 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
          >
            SEGUIR COMPRANDO
          </Link>
          <Link
            href={`/rastrear/${encodeURIComponent(orderNumber)}`}
            className="px-8 py-3.5 border-2 border-black font-heading font-bold text-sm tracking-widest rounded hover:bg-black hover:text-white transition-colors"
          >
            VER PEDIDO
          </Link>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mx-auto mb-5">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold">
          {isReservation ? '¡Pedido apartado!' : '¡Pedido creado!'}
        </h1>
        <p className="text-gray-text mt-1">
          Pedido{' '}
          <span className="font-heading font-bold text-black">{orderNumber}</span>
          {' · '}
          {isReservation ? (
            <>
              <span className="font-heading font-bold text-black">{formatPrice(shownAmount, shownCurrency)}</span>
              <span className="text-xs ml-1">({reservationPct}% de {formatPrice(showDivisa ? (divisaTotal ?? 0) : total, shownCurrency)})</span>
            </>
          ) : (
            <span className="font-heading font-bold text-black">{formatPrice(shownAmount, shownCurrency)}</span>
          )}
        </p>
        {customerName && (
          <p className="text-gray-text text-sm mt-0.5">
            Hola {customerName.split(' ')[0]},{' '}
            {isReservation
              ? `ahora envía el comprobante del apartado del ${reservationPct}%.`
              : 'ahora envía tu comprobante de pago.'}
          </p>
        )}
      </div>

      {/* Payment data reminder */}
      {paymentFields.length > 0 && (
        <div className="bg-gray-bg rounded-lg border border-gray-light px-4 py-4 space-y-3">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
            Datos para el pago — {methodLabel}
          </p>
          <div className="space-y-2">
            {paymentFields.map((f) => (
              <div key={f.label} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-text shrink-0">{f.label}</span>
                <span className="font-medium text-black text-right break-all">{f.value}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-light pt-3 space-y-1">
            {showDivisa ? (
              <p className="text-sm font-heading font-bold text-green-700">
                💵 Monto a pagar: {formatPrice(shownAmount, 'USD')}
              </p>
            ) : (
              <>
                <p className="text-sm font-heading font-bold text-red-600">
                  Monto a pagar: {formatPrice(shownAmount, currency)}
                </p>
                {bcvRate != null ? (
                  <p className="text-base font-heading font-bold text-black mt-1">
                    ≈ {formatBs(shownAmount, bcvRate)}
                    <span className="text-xs font-normal text-gray-text ml-1">(Tasa BCV hoy)</span>
                  </p>
                ) : (
                  <p className="text-xs text-red-600 font-semibold leading-snug">
                    {`Calcula el equivalente en Bs. a la tasa BCV del ${currency === 'USD' ? 'dólar' : 'euro'} del día de hoy antes de realizar el pago.`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Proof form */}
      <div className="border border-gray-light rounded-lg p-6 space-y-5">
        <div>
          <h2 className="font-heading font-bold text-base">
            {isReservation ? `Enviar comprobante del apartado (${reservationPct}%)` : 'Enviar comprobante de pago'}
          </h2>
          <p className="text-sm text-gray-text mt-1">
            {isReservation
              ? `Completa los datos del pago de ${formatPrice(shownAmount, shownCurrency)} y envíalos por WhatsApp para reservar tu pedido.`
              : 'Completa los datos de tu pago y envíalos por WhatsApp a la tienda para que verifiquemos tu pago.'}
          </p>
        </div>

        {/* Proof image */}
        <div>
          <label className="block text-sm font-heading font-medium text-black mb-2">
            Captura / foto del comprobante
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {proofPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofPreview}
                alt="Comprobante"
                className="max-h-52 rounded border border-gray-light object-contain w-full bg-gray-bg"
              />
              <button
                type="button"
                onClick={() => { setProofFile(null); setProofPreview('') }}
                className="absolute top-2 right-2 w-6 h-6 bg-black text-white rounded-full text-sm flex items-center justify-center leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-light rounded-lg py-8 text-gray-text hover:border-black hover:text-black transition-colors"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-medium">Seleccionar imagen</span>
              <span className="text-xs mt-1">PNG, JPG, WebP — máx. 5 MB</span>
            </button>
          )}
        </div>

        {/* Transaction ID */}
        <div>
          <label className="block text-sm font-heading font-medium text-black mb-1.5">
            ID / Referencia de la transacción
          </label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Ej: 123456789"
            className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Payment date */}
        <div>
          <label className="block text-sm font-heading font-medium text-black mb-1.5">
            Fecha del pago
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Account holder */}
        <div>
          <label className="block text-sm font-heading font-medium text-black mb-1.5">
            Nombre del titular de la cuenta desde donde pagaste
          </label>
          <input
            type="text"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="Ej: María García"
            className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
          />
          <p className="text-xs text-gray-text mt-1">
            Déjalo vacío si pagaste desde tu propia cuenta.
          </p>
        </div>

        {error && (
          <p className="text-sm text-sale bg-red-50 border border-red-200 rounded px-4 py-3">{error}</p>
        )}

        {/* WhatsApp submit */}
        <button
          type="button"
          disabled={sending}
          onClick={handleSend}
          className="w-full py-4 bg-green-600 text-white font-heading font-bold text-sm tracking-wider rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {sending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando…
            </>
          ) : (
            <>
              <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              ENVIAR DATOS DE PAGO POR WHATSAPP
            </>
          )}
        </button>

        <p className="text-xs text-gray-text text-center">
          Se abrirá WhatsApp con un mensaje pre-rellenado. Envíalo para completar la verificación.
        </p>
      </div>
    </div>
  )
}
