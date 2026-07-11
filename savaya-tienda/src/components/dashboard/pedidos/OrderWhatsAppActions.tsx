'use client'

import { useState, useRef, useTransition } from 'react'
import type { OrderStatus } from '@/lib/types'
import { verifyPayment, markShipped, markDelivered } from './whatsapp-actions'

// ─── WA message builders ──────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  binance: 'Binance Pay',
  usdt: 'USDT (TRC20)',
  bank_transfer_ve: 'Transferencia bancaria',
  pago_movil: 'Pago móvil',
  efectivo: 'Efectivo',
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function waLink(phone: string, text: string) {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(text)}`
}

function msgPaymentVerified(name: string, orderNumber: string) {
  return [
    `¡Hola ${name}!`,
    '',
    `✓ Verificamos tu pago para el pedido *#${orderNumber}*`,
    '',
    '→ Tu orden está en preparación. Te avisaremos cuando sea enviada.',
    '',
    '¡Gracias por confiar en Savaya!',
  ].join('\n')
}

function msgShipped(name: string, orderNumber: string, tracking: string, notes: string, proofUrl: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'
  return [
    `\u{1F4E6} ¡Hola ${name}! Tu pedido *#${orderNumber}* fue enviado.`,
    '',
    tracking ? `\u{1F50D} Nº de seguimiento: *${tracking}*` : null,
    notes ? notes : null,
    proofUrl ? `\u{1F4CB} Comprobante de envío: ${proofUrl}` : null,
    '',
    `\u{1F517} Rastrea tu pedido aquí:\n${appUrl}/rastrear/${orderNumber}`,
    '',
    '\u{1F91D} ¡Gracias por comprar con Savaya!',
  ].filter((l) => l !== null).join('\n')
}

function msgDelivered(name: string, orderNumber: string) {
  return [
    `¡Hola ${name}!`,
    '',
    `✓ ¡Tu pedido *#${orderNumber}* fue entregado!`,
    '',
    'Esperamos que disfrutes tu compra.',
    '',
    '¡Gracias por comprar con Savaya!',
    'Si tienes alguna duda, escríbenos cuando quieras.',
  ].join('\n')
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string | null
  currentStatus: OrderStatus
  paymentMethod: string | null
  paymentProofUrl: string | null
  paymentTransactionId: string | null
  paymentDate: string | null
  paymentAccountHolder: string | null
  trackingNumber: string | null
  shippingProofUrl: string | null
  shippingNotes: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderWhatsAppActions({
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  currentStatus,
  paymentMethod,
  paymentProofUrl,
  paymentTransactionId,
  paymentDate,
  paymentAccountHolder,
  trackingNumber: initialTracking,
  shippingProofUrl: initialShippingProof,
  shippingNotes: initialShippingNotes,
}: Props) {
  const firstName = customerName.split(' ')[0] || customerName
  const methodLabel = PAYMENT_LABELS[paymentMethod ?? ''] || paymentMethod || ''

  // Shipping form state
  const [tracking, setTracking] = useState<string>(initialTracking ?? '')
  const [shippingNotes, setShippingNotes] = useState<string>(initialShippingNotes ?? '')
  const [shippingProof, setShippingProof] = useState<string>(initialShippingProof ?? '')
  const [shippingProofFile, setShippingProofFile] = useState<File | null>(null)
  const [shippingPreview, setShippingPreview] = useState<string>(initialShippingProof ?? '')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [isPendingVerify, startVerify] = useTransition()
  const [isPendingShip, startShip] = useTransition()
  const [isPendingDeliver, startDeliver] = useTransition()
  const [actionError, setActionError] = useState('')
  const [shippingWaUrl, setShippingWaUrl] = useState('')
  const [deliveredWaUrl, setDeliveredWaUrl] = useState('')

  const isTerminal = ['cancelled', 'returned', 'delivered'].includes(currentStatus)

  async function handleShippingFileSelect(file: File | null) {
    if (!file) return
    setShippingProofFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setShippingPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadShippingProof(): Promise<string | null> {
    if (!shippingProofFile) return shippingProof || null
    setUploadingProof(true)
    try {
      const fd = new FormData()
      fd.append('file', shippingProofFile)
      const res = await fetch('/api/upload?folder=savaya/envios', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      setShippingProof(data.url ?? '')
      return data.url ?? null
    } finally {
      setUploadingProof(false)
    }
  }

  function handleVerify() {
    setActionError('')
    startVerify(async () => {
      const result = await verifyPayment(orderId)
      if ('error' in result) setActionError(result.error ?? 'Error')
    })
  }

  async function handleMarkShipped() {
    setActionError('')
    setShippingError('')
    try {
      const proofUrl = await uploadShippingProof()
      startShip(async () => {
        const result = await markShipped(orderId, {
          tracking_number: tracking.trim() || undefined,
          shipping_proof_url: proofUrl ?? undefined,
          shipping_notes: shippingNotes.trim() || undefined,
        })
        if ('error' in result) setShippingError(result.error ?? 'Error')
        else if (customerPhone) {
          const msg = msgShipped(firstName, orderNumber, tracking.trim(), shippingNotes.trim(), proofUrl ?? '')
          setShippingWaUrl(waLink(customerPhone, msg))
        }
      })
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : 'Error')
    }
  }

  function handleMarkDelivered() {
    setActionError('')
    startDeliver(async () => {
      const result = await markDelivered(orderId)
      if ('error' in result) setActionError(result.error ?? 'Error')
      else if (customerPhone) {
        const msg = msgDelivered(firstName, orderNumber)
        setDeliveredWaUrl(waLink(customerPhone, msg))
      }
    })
  }

  // ── Payment proof display ────────────────────────────────────────────────────
  const hasProof = paymentProofUrl || paymentTransactionId || paymentDate || paymentAccountHolder

  return (
    <div className="bg-white rounded border border-gray-light p-5 space-y-6">
      <h2 className="text-sm font-heading font-semibold text-black">Flujo de pago y envío</h2>

      {actionError && (
        <p className="text-xs text-sale bg-red-50 border border-red-200 rounded px-3 py-2">{actionError}</p>
      )}

      {/* ── 1. Payment proof ────────────────────────────────────────────────── */}
      {hasProof && (
        <div className="border border-gray-light rounded-lg p-4 space-y-3">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
            Comprobante del cliente
          </p>

          {paymentProofUrl && (
            <a href={paymentProofUrl} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={paymentProofUrl}
                alt="Comprobante"
                className="max-h-48 rounded border border-gray-light object-contain w-full bg-gray-bg hover:opacity-90 transition-opacity"
              />
              <p className="text-xs text-accent underline mt-1">Ver imagen completa</p>
            </a>
          )}

          <dl className="space-y-1.5 text-sm">
            {methodLabel && (
              <div className="flex gap-2">
                <dt className="text-gray-text w-32 shrink-0">Método</dt>
                <dd className="font-medium text-black capitalize">{methodLabel}</dd>
              </div>
            )}
            {paymentTransactionId && (
              <div className="flex gap-2">
                <dt className="text-gray-text w-32 shrink-0">ID transacción</dt>
                <dd className="font-medium text-black break-all">{paymentTransactionId}</dd>
              </div>
            )}
            {paymentDate && (
              <div className="flex gap-2">
                <dt className="text-gray-text w-32 shrink-0">Fecha de pago</dt>
                <dd className="font-medium text-black">{paymentDate}</dd>
              </div>
            )}
            {paymentAccountHolder && (
              <div className="flex gap-2">
                <dt className="text-gray-text w-32 shrink-0">Titular cuenta</dt>
                <dd className="font-medium text-black">{paymentAccountHolder}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* ── 2. Verify payment (status = pending) ────────────────────────────── */}
      {currentStatus === 'pending' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-sm font-heading font-semibold">Pago pendiente de verificación</p>
          </div>
          <button
            disabled={isPendingVerify}
            onClick={handleVerify}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white font-heading font-semibold text-sm rounded hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isPendingVerify && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            ✓ Verificar pago
          </button>
          {customerPhone && (
            <a
              href={waLink(customerPhone, msgPaymentVerified(firstName, orderNumber))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 transition-colors"
            >
              <WhatsAppIcon /> Enviar confirmación de pago al cliente
            </a>
          )}
        </div>
      )}

      {/* ── 3. Shipping form (status = paid / processing) ────────────────────── */}
      {(currentStatus === 'paid' || currentStatus === 'processing') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm font-heading font-semibold">Pago verificado</p>
          </div>

          {customerPhone && (
            <a
              href={waLink(customerPhone, msgPaymentVerified(firstName, orderNumber))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 transition-colors"
            >
              <WhatsAppIcon /> Enviar confirmación de pago al cliente
            </a>
          )}

          <div className="border-t border-gray-light pt-4 space-y-3">
            <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-text">
              Registrar envío
            </p>

            {/* Shipping proof image */}
            <div>
              <label className="block text-xs font-heading font-medium text-black mb-1.5">
                Comprobante de envío
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleShippingFileSelect(e.target.files?.[0] ?? null)}
              />
              {shippingPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shippingPreview}
                    alt="Comprobante de envío"
                    className="max-h-32 rounded border border-gray-light object-contain w-full bg-gray-bg"
                  />
                  <button
                    type="button"
                    onClick={() => { setShippingProofFile(null); setShippingPreview(''); setShippingProof('') }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black text-white rounded-full text-xs flex items-center justify-center"
                  >×</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-light rounded text-xs text-gray-text hover:border-black hover:text-black transition-colors"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Subir comprobante
                </button>
              )}
            </div>

            {/* Tracking */}
            <div>
              <label className="block text-xs font-heading font-medium text-black mb-1.5">
                Número de seguimiento
              </label>
              <input
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Ej: CO123456789"
                className="w-full h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-heading font-medium text-black mb-1.5">
                Información de envío
              </label>
              <textarea
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                placeholder="Ej: Despacho por MRW. Llegada estimada 3-5 días hábiles."
                rows={2}
                className="w-full border border-gray-light rounded px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>

            {shippingError && (
              <p className="text-xs text-sale">{shippingError}</p>
            )}

            {shippingWaUrl ? (
              <a
                href={shippingWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white font-heading font-semibold text-sm rounded hover:bg-[#1fb858] transition-colors"
              >
                <WhatsAppIcon /> Notificar cliente por WhatsApp
              </a>
            ) : (
              <button
                disabled={isPendingShip || uploadingProof}
                onClick={handleMarkShipped}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-heading font-semibold text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {(isPendingShip || uploadingProof) && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Marcar como enviado {customerPhone ? '+ notificar' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Shipped (status = shipped) ─────────────────────────────────────── */}
      {currentStatus === 'shipped' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-sm font-heading font-semibold">Pedido enviado</p>
          </div>

          {customerPhone && (
            <a
              href={waLink(
                customerPhone,
                msgShipped(firstName, orderNumber, initialTracking ?? '', initialShippingNotes ?? '', initialShippingProof ?? ''),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 transition-colors"
            >
              <WhatsAppIcon /> Enviar datos de envío al cliente
            </a>
          )}

          {shippingPreview && (
            <div>
              <p className="text-[10px] text-gray-text mb-1 font-heading font-bold uppercase tracking-widest">
                Comprobante de envío
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shippingPreview}
                alt="Comprobante de envío"
                className="max-h-28 rounded border border-gray-light object-contain bg-gray-bg"
              />
            </div>
          )}

          <div className="border-t border-gray-light pt-4 flex flex-col gap-3">
            {deliveredWaUrl ? (
              <a
                href={deliveredWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white font-heading font-semibold text-sm rounded hover:bg-[#1fb858] transition-colors"
              >
                <WhatsAppIcon /> Enviar gracias al cliente
              </a>
            ) : (
              <button
                disabled={isPendingDeliver}
                onClick={handleMarkDelivered}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-heading font-semibold text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isPendingDeliver && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                ✓ Marcar como entregado {customerPhone ? '+ notificar' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Delivered (status = delivered) ────────────────────────────────── */}
      {currentStatus === 'delivered' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm font-heading font-semibold">Pedido entregado</p>
          </div>

          {customerPhone && (
            <a
              href={waLink(customerPhone, msgDelivered(firstName, orderNumber))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 transition-colors"
            >
              <WhatsAppIcon /> Enviar mensaje de gracias al cliente
            </a>
          )}
        </div>
      )}

      {isTerminal && !['delivered'].includes(currentStatus) && (
        <p className="text-sm text-gray-text">Este pedido está en estado final ({currentStatus}).</p>
      )}
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
