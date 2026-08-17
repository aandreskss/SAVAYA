'use client'

import { useState } from 'react'
import { ProofStatusBadge } from './OrderStatusBadge'
import type { AdminPaymentProof } from '../types'

const CURRENCY_LABELS: Record<string, string> = {
  usd: 'USD',
  ves: 'Bs.',
}

type Props = {
  proof: AdminPaymentProof
  orderId: string
}

export function PaymentProofViewer({ proof }: Props) {
  // URL is derived directly — no effect needed since it's pure computation from props
  const imageUrl = proof.cloudinaryPublicId
    ? `/api/admin/orders/proof-url?proofId=${proof.id}`
    : null
  const [imageError, setImageError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const currency = CURRENCY_LABELS[proof.currency] ?? proof.currency

  return (
    <section className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-medium">Comprobante de pago</h2>
        <ProofStatusBadge status={proof.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left: proof data */}
        <div className="p-5">
          <dl className="space-y-2 text-sm">
            <Field label="Método" value={proof.paymentMethodName} />
            <Field label="Monto pagado" value={`${currency} ${proof.amountPaid}`} />
            <Field label="Referencia" value={proof.reference} mono />
            <Field label="Fecha de pago" value={proof.paymentDate} />
            <Field label="Titular" value={proof.holderName} />
            {proof.metadata && Object.keys(proof.metadata).length > 0 && (
              <MetadataFields metadata={proof.metadata} />
            )}
          </dl>

          {proof.rejectionReason && (
            <div className="mt-4 p-3 bg-error/5 border border-error/20 rounded-lg">
              <p className="text-xs font-medium text-error mb-1">Motivo de rechazo</p>
              <p className="text-sm text-text-secondary">{proof.rejectionReason}</p>
            </div>
          )}

          {proof.reviewedAt && (
            <p className="text-xs text-text-secondary mt-4">
              Revisado el{' '}
              {new Date(proof.reviewedAt).toLocaleString('es-VE', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Right: image */}
        <div className="p-5 flex items-center justify-center min-h-[200px]">
          {!proof.cloudinaryPublicId ? (
            <div className="text-center text-text-secondary text-sm">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Sin comprobante adjunto
            </div>
          ) : imageError ? (
            <div className="text-center text-text-secondary text-sm">
              <p>No se pudo cargar el comprobante.</p>
              <a
                href={`/api/admin/orders/proof-url?proofId=${proof.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline mt-1 inline-block"
              >
                Abrir en nueva pestaña
              </a>
            </div>
          ) : imageUrl ? (
            <div className="relative w-full">
              <button
                onClick={() => setIsExpanded(true)}
                className="block w-full focus:outline-none focus:ring-2 focus:ring-accent-gold/20 rounded-lg"
                aria-label="Ampliar comprobante"
              >
                {/* Proxy route streams content — next/image incompatible */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Comprobante de pago"
                  className="w-full max-h-64 object-contain rounded-lg border border-border cursor-zoom-in"
                  onError={() => setImageError(true)}
                />
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="mt-2 text-xs text-text-secondary hover:underline block mx-auto"
              >
                Ampliar →
              </button>
            </div>
          ) : (
            <div className="w-full max-h-64 bg-surface-2 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isExpanded && imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/80 p-4"
          onClick={() => setIsExpanded(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Comprobante de pago ampliado"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-brand-white bg-brand-black/50 rounded-full w-9 h-9 flex items-center justify-center hover:bg-brand-black/80 transition-colors"
            onClick={() => setIsExpanded(false)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex gap-2">
      <dt className="text-text-secondary w-28 shrink-0">{label}</dt>
      <dd className={mono ? 'font-mono text-xs' : ''}>{value}</dd>
    </div>
  )
}

function MetadataFields({ metadata }: { metadata: Record<string, unknown> }) {
  const LABELS: Record<string, string> = {
    bankName: 'Banco',
    bankPhone: 'Teléfono banco',
    binanceId: 'ID Binance',
    usdtAddress: 'Dirección USDT',
  }
  return (
    <>
      {Object.entries(metadata).map(([key, val]) =>
        val ? (
          <Field key={key} label={LABELS[key] ?? key} value={String(val)} />
        ) : null,
      )}
    </>
  )
}
