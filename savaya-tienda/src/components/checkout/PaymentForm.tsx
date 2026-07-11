'use client'

import { useState } from 'react'
import { cn, formatPrice } from '@/lib/utils'
import { formatBs } from '@/lib/bcvRate'
import type { CartItem, PaymentMethod, ShippingMethodType, PaymentConfigDB } from '@/lib/types'
import type { ShippingFormData } from './ShippingForm'
import { useCurrency } from '@/components/providers/CurrencyProvider'

const DIVISA_METHODS: PaymentMethod[] = ['zelle', 'binance', 'usdt']

// ─── Default payment config (shown when DB has no data yet) ──────────────────

const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  description: string
  defaultNote: string
  getFields: (db: PaymentConfigDB | null) => { label: string; value: string }[]
  getNote: (db: PaymentConfigDB | null) => string
  getImages: (db: PaymentConfigDB | null) => string[]
}[] = [
  {
    id: 'zelle',
    label: 'Zelle',
    description: 'Transferencia en dólares (USD)',
    defaultNote: 'Envía captura del comprobante por WhatsApp o Instagram al recibir tu número de pedido.',
    getFields: (db) => [
      { label: 'Titular', value: db?.zelle?.titular || '← Nombre del titular' },
      { label: 'Email / Teléfono', value: db?.zelle?.email_phone || '← Email o teléfono' },
    ],
    getNote: (db) => db?.zelle?.note || '',
    getImages: (db) => db?.zelle?.images ?? [],
  },
  {
    id: 'binance',
    label: 'Binance Pay',
    description: 'Paga con cualquier cripto vía Binance',
    defaultNote: 'En Binance: Billetera → Pagar → ingresa el Pay ID. Envía captura del pago.',
    getFields: (db) => [
      { label: 'Pay ID', value: db?.binance?.pay_id || '← Pay ID' },
    ],
    getNote: (db) => db?.binance?.note || '',
    getImages: (db) => db?.binance?.images ?? [],
  },
  {
    id: 'usdt',
    label: 'USDT',
    description: 'Tether USD — Red TRC20',
    defaultNote: '⚠ Usa únicamente la red TRC20. Envía el TX Hash por WhatsApp.',
    getFields: (db) => [
      { label: 'Red', value: 'TRC20 (TRON)' },
      { label: 'Dirección', value: db?.usdt?.address || '← Dirección de wallet' },
    ],
    getNote: (db) => db?.usdt?.note || '',
    getImages: (db) => db?.usdt?.images ?? [],
  },
  {
    id: 'bank_transfer_ve',
    label: 'Transferencia bancaria',
    description: 'Bancos venezolanos (Bs.)',
    defaultNote: 'Envía el comprobante por WhatsApp o al correo con tu número de pedido.',
    getFields: (db) => [
      { label: 'Banco', value: db?.bank_transfer_ve?.banco || '← Banco' },
      { label: 'Tipo', value: db?.bank_transfer_ve?.tipo || '← Tipo de cuenta' },
      { label: 'Número', value: db?.bank_transfer_ve?.numero || '← Número de cuenta' },
      { label: 'Titular', value: db?.bank_transfer_ve?.titular || '← Nombre completo' },
      { label: db?.bank_transfer_ve?.ci_type === 'rif' ? 'RIF' : 'CI', value: db?.bank_transfer_ve?.ci || '← Cédula / RIF' },
    ],
    getNote: (db) => db?.bank_transfer_ve?.note || '',
    getImages: (db) => db?.bank_transfer_ve?.images ?? [],
  },
  {
    id: 'pago_movil',
    label: 'Pago móvil',
    description: 'Pago móvil interbancario',
    defaultNote: 'Envía captura del comprobante por WhatsApp con tu número de pedido.',
    getFields: (db) => [
      { label: 'Banco', value: db?.pago_movil?.banco || '← Banco' },
      { label: 'Teléfono', value: db?.pago_movil?.telefono || '← Teléfono' },
      { label: db?.pago_movil?.ci_type === 'rif' ? 'RIF' : 'CI', value: db?.pago_movil?.ci || '← Cédula / RIF' },
    ],
    getNote: (db) => db?.pago_movil?.note || '',
    getImages: (db) => db?.pago_movil?.images ?? [],
  },
  {
    id: 'efectivo',
    label: 'Efectivo',
    description: 'Pago en efectivo al retirar en tienda',
    defaultNote: 'Trae el monto exacto al momento de retirar tu pedido. Te avisaremos cuando esté listo.',
    getFields: () => [],
    getNote: (db) => db?.efectivo?.note || '',
    getImages: (db) => db?.efectivo?.images ?? [],
  },
]

const RESERVATION_OPTIONS = [
  { pct: 20, label: '20%', desc: 'Aparta con el 20% del total' },
  { pct: 35, label: '35%', desc: 'Aparta con el 35% del total' },
  { pct: 50, label: '50%', desc: 'Aparta con la mitad del total' },
] as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  shippingData: ShippingFormData
  shippingMethod: ShippingMethodType
  total: number
  loading: boolean
  error: string
  onBack: () => void
  onSubmit: (method: PaymentMethod, reservationPct?: number) => void
  paymentConfig?: PaymentConfigDB | null
  enabledMethods?: string[] | null
  items?: CartItem[]
  bcvRate?: number | null
  isWholesale?: boolean
  totalQuantity?: number
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PaymentForm({
  shippingData,
  shippingMethod,
  total,
  loading,
  error,
  onBack,
  onSubmit,
  paymentConfig = null,
  enabledMethods = null,
  items = [],
  bcvRate,
  isWholesale = false,
  totalQuantity = 0,
}: PaymentFormProps) {
  const currency = useCurrency()
  const isStorePickup = shippingMethod === 'pickup'

  const divisaTotal = items.reduce((s, i) => {
    const dp = isWholesale && i.wholesaleDivisaPrice != null
      ? i.wholesaleDivisaPrice
      : (i.divisaPrice ?? (isWholesale && i.wholesalePrice != null ? i.wholesalePrice : i.price))
    return s + dp * i.quantity
  }, 0)
  const hasDivisa = items.some(i => i.divisaPrice != null || i.wholesaleDivisaPrice != null)
  const bcvNote = currency === 'USD' ? 'En dólares · Tasa DÓLAR BCV' : 'En euros · Tasa EURO BCV'
  const enabledSet = enabledMethods && enabledMethods.length > 0 ? new Set(enabledMethods) : null

  const defaultMethod: PaymentMethod = (() => {
    const preferred = isStorePickup ? 'zelle' : 'zelle'
    if (!enabledSet) return preferred
    if (enabledSet.has(preferred)) return preferred
    const first = PAYMENT_METHODS.find((m) => enabledSet.has(m.id))
    return (first?.id ?? preferred) as PaymentMethod
  })()

  const [method, setMethod] = useState<PaymentMethod>(defaultMethod)
  const [reservationPct, setReservationPct] = useState<20 | 35 | 50 | null>(null)
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null)

  const selectedConfig = PAYMENT_METHODS.find((c) => c.id === method)

  // ── Vista de mayoreo: coordinar por WhatsApp ─────────────────────────────────
  if (isWholesale) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-bold">Compra al mayor 🛍️</h2>
          <p className="text-sm text-gray-text mt-1">
            Tu pedido tiene <span className="font-semibold text-black">{totalQuantity} pares</span> — precio al mayor activado. Coordina el pago directamente por WhatsApp con un asesor.
          </p>
        </div>

        <ShippingSummary shippingData={shippingData} onBack={onBack} />

        {/* Total wholesale */}
        <div className="rounded-lg overflow-hidden border-2 border-black">
          <div className="bg-black px-4 py-3 text-white text-center">
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-white/60 mb-1">
              Total al mayor · {totalQuantity} pares
            </p>
            <p className="text-3xl font-heading font-bold">{formatPrice(total, currency)}</p>
          </div>
          <div className="bg-gray-50 px-4 py-3 text-center">
            <p className="text-xs text-gray-500">
              Un asesor confirmará disponibilidad y te indicará los métodos de pago disponibles.
            </p>
          </div>
        </div>

        {/* Accepted payment methods */}
        <div className="border border-gray-light rounded-lg px-4 py-3">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-3">
            Métodos de pago aceptados al mayor
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Binance Pay', color: 'bg-amber-50 border-amber-200 text-amber-800' },
              { label: 'USDT', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
              { label: 'Zelle', color: 'bg-green-50 border-green-200 text-green-800' },
              { label: 'Pago Móvil', color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { label: 'Transferencia', color: 'bg-slate-50 border-slate-200 text-slate-700' },
              { label: 'Efectivo', color: 'bg-gray-50 border-gray-200 text-gray-700' },
            ].map(({ label, color }) => (
              <span key={label} className={cn('text-[11px] font-heading font-semibold border rounded px-2.5 py-1', color)}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {error && <ErrorBox message={error} />}

        {/* WhatsApp CTA */}
        <button
          type="button"
          disabled={loading}
          onClick={() => onSubmit('wholesale_whatsapp')}
          className="w-full py-4 bg-[#25D366] text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-[#20b857] transition-colors disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
        >
          {loading ? <Spinner /> : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              TERMINAR DE COORDINAR TU PEDIDO EN WHATSAPP
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-text">
          Se registrará tu pedido y se abrirá WhatsApp con los detalles.
        </p>

        <button type="button" onClick={onBack} className="w-full py-3 text-sm text-gray-text hover:text-black transition-colors">
          ← Volver al método de entrega
        </button>
      </div>
    )
  }

  // ── Vista de retiro en tienda con reserva ────────────────────────────────────
  if (isStorePickup) {
    const isPickupDivisa = DIVISA_METHODS.includes(method) && hasDivisa
    const pickupTotal = isPickupDivisa ? divisaTotal : total
    const pickupCurrency = isPickupDivisa ? 'USD' : currency
    const reservationAmount = reservationPct ? Math.round(total * reservationPct) / 100 : null
    const pickupReservationAmount = reservationPct ? Math.round(pickupTotal * reservationPct) / 100 : null
    const availableForPickup = PAYMENT_METHODS
      .filter((c) => c.id !== 'efectivo') // efectivo se paga en tienda, no aplica para reserva
      .filter((c) => !enabledSet || enabledSet.has(c.id))

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-bold">Apartado para retiro en tienda</h2>
          <p className="text-sm text-gray-text mt-1">
            Para reservar tu pedido debes pagar un porcentaje ahora. El resto lo pagas al retirar.
          </p>
        </div>

        <ShippingSummary shippingData={shippingData} onBack={onBack} />

        {/* Reservation % selector */}
        <div>
          <p className="text-xs font-heading font-semibold uppercase tracking-wider text-gray-text mb-3">
            ¿Cuánto deseas apartar? *
          </p>
          <div className="grid grid-cols-3 gap-3">
            {RESERVATION_OPTIONS.map(({ pct, label, desc }) => (
              <button
                key={pct}
                type="button"
                onClick={() => setReservationPct(pct)}
                className={cn(
                  'flex flex-col items-center gap-1 border-2 rounded-lg px-3 py-4 text-center transition-colors',
                  reservationPct === pct ? 'border-black bg-black text-white' : 'border-gray-light hover:border-gray-text/50',
                )}
              >
                <span className="text-xl font-heading font-bold">{label}</span>
                <span className={cn('text-[10px]', reservationPct === pct ? 'text-white/70' : 'text-gray-text')}>
                  {desc}
                </span>
                {reservationPct === pct && (
                  <span className="text-xs font-bold mt-1">
                    {formatPrice(Math.round(pickupTotal * pct) / 100, pickupCurrency)}
                  </span>
                )}
              </button>
            ))}
          </div>
          {pickupReservationAmount !== null && (
            <div className="mt-4 bg-gray-bg rounded-lg px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-text">Total del pedido</span>
                <span className="font-medium">{formatPrice(pickupTotal, pickupCurrency)}</span>
              </div>
              <div className="flex justify-between mt-1.5 font-heading font-bold text-base">
                <span>Pagas ahora ({reservationPct}%)</span>
                <span className={isPickupDivisa ? 'text-green-700' : 'text-black'}>
                  {formatPrice(pickupReservationAmount, pickupCurrency)}
                </span>
              </div>
              {!isPickupDivisa && bcvRate != null && (
                <div className="flex justify-between mt-0.5">
                  <span />
                  <span className="text-sm font-semibold text-black">
                    ≈ {formatBs(pickupReservationAmount, bcvRate)}
                    <span className="text-xs font-normal text-gray-text ml-1">(Tasa BCV hoy)</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between mt-1 text-gray-text text-xs">
                <span>Resto al retirar en tienda</span>
                <span>{formatPrice(pickupTotal - pickupReservationAmount, pickupCurrency)}</span>
              </div>
            </div>
          )}
        </div>

        {reservationPct !== null && (
          <>
            {/* Payment method selector */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-heading font-semibold uppercase tracking-wider text-gray-text mb-1">
                Método de pago para el apartado *
              </p>
              {availableForPickup.map((cfg) => (
                <label
                  key={cfg.id}
                  className={cn(
                    'flex items-center gap-4 border-2 rounded-lg px-4 py-3.5 cursor-pointer transition-colors',
                    method === cfg.id ? 'border-black bg-white' : 'border-gray-light hover:border-gray-text/50',
                  )}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={cfg.id}
                    checked={method === cfg.id}
                    onChange={() => setMethod(cfg.id)}
                    className="sr-only"
                  />
                  <RadioCircle selected={method === cfg.id} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-none">{cfg.label}</p>
                    <p className="text-xs text-gray-text mt-0.5">{cfg.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Instructions panel */}
            {selectedConfig && (
              <div className="bg-gray-bg rounded-lg border border-gray-light px-4 py-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-red-600 mb-3">
                  Instrucciones — {selectedConfig.label}
                </p>
                {(() => {
                  const fields = selectedConfig.getFields(paymentConfig)
                  return fields.length > 0 ? (
                    <div className="flex flex-col gap-2 mb-3">
                      {fields.map((f) => (
                        <div key={f.label} className="flex justify-between gap-3 text-sm">
                          <span className="text-gray-text shrink-0">{f.label}</span>
                          <span className="font-medium text-black text-right break-all">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}
                {(() => {
                  const note = selectedConfig.getNote(paymentConfig) || selectedConfig.defaultNote
                  return note ? (
                    <p className="text-xs text-gray-text leading-relaxed border-t border-gray-light pt-3 mt-1">{note}</p>
                  ) : null
                })()}
              </div>
            )}

            {/* Price panel for pickup */}
            {isPickupDivisa ? (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-green-700 mb-2">
                  💵 Apartado a pagar en {selectedConfig?.label}
                </p>
                <p className="text-xl font-heading font-bold text-green-800">
                  {formatPrice(pickupReservationAmount!, 'USD')}
                </p>
                <p className="text-xs text-green-600 mt-0.5">Precio en dólares (USD)</p>
              </div>
            ) : (
              <div className="bg-gray-bg border border-gray-light rounded-lg px-4 py-3">
                <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2">
                  Apartado a pagar
                </p>
                <p className="text-xl font-heading font-bold text-black">
                  {formatPrice(pickupReservationAmount!, currency)}
                </p>
                <p className="text-xs text-gray-text mt-0.5">{bcvNote}</p>
                {bcvRate != null && (
                  <p className="text-sm font-heading font-semibold text-black mt-2">
                    ≈ {formatBs(pickupReservationAmount!, bcvRate)}
                    <span className="text-xs font-normal text-gray-text ml-1">(Tasa BCV hoy)</span>
                  </p>
                )}
              </div>
            )}

            {error && <ErrorBox message={error} />}

            <button
              type="button"
              disabled={loading}
              onClick={() => setConfirmCallback(() => () => onSubmit(method, reservationPct ?? undefined))}
              className="w-full py-4 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? <Spinner /> : `ENVIAR COMPROBANTE DE APARTADO — ${formatPrice(pickupReservationAmount!, pickupCurrency)} →`}
            </button>
          </>
        )}

        <button type="button" onClick={onBack} className="w-full py-3 text-sm text-gray-text hover:text-black transition-colors">
          ← Volver al tipo de envío
        </button>

        {confirmCallback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
              <p className="font-heading font-bold text-black mb-3">Antes de confirmar</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                En la siguiente ventana debes cargar el comprobante de pago, asegúrate de tener todos los datos del pago que vas a realizar antes de confirmar el pedido.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { confirmCallback(); setConfirmCallback(null) }}
                  className="w-full py-3 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
                >
                  ENTENDIDO, CONFIRMAR →
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCallback(null)}
                  className="w-full py-2.5 text-sm text-gray-text hover:text-black transition-colors"
                >
                  Cancelar, revisar datos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Vista simplificada para pago en destino ──────────────────────────────────
  if (shippingMethod === 'cash_on_delivery') {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-xl font-bold">Confirmar pedido</h2>

        <ShippingSummary shippingData={shippingData} onBack={onBack} />

        <div className="rounded-lg border-2 border-black bg-white p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <h3 className="font-heading font-bold text-base mb-2">Pago en efectivo al recibir</h3>
          <p className="text-sm text-gray-text leading-relaxed">
            Pagarás{' '}
            <span className="font-heading font-bold text-black text-base">{formatPrice(total, currency)}</span>{' '}
            en efectivo cuando el repartidor entregue tu pedido.
          </p>
          <p className="text-xs text-gray-text mt-3 bg-gray-bg rounded px-3 py-2">
            Ten el monto exacto listo. El repartidor no maneja cambio.
          </p>
        </div>

        {error && <ErrorBox message={error} />}

        <button
          type="button"
          disabled={loading}
          onClick={() => onSubmit('efectivo')}
          className="w-full py-4 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner /> : 'CONFIRMAR PEDIDO →'}
        </button>

        <button type="button" onClick={onBack} className="w-full py-3 text-sm text-gray-text hover:text-black transition-colors">
          ← Volver al método de entrega
        </button>
      </div>
    )
  }

  // ── Vista estándar con selección de método ───────────────────────────────────
  const availableMethods = PAYMENT_METHODS
    .filter((c) => c.id !== 'efectivo')
    .filter((c) => !enabledSet || enabledSet.has(c.id))

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-bold">Método de pago</h2>

      <ShippingSummary shippingData={shippingData} onBack={onBack} />

      {/* Method selector */}
      <div className="flex flex-col gap-2">
        {availableMethods.map((cfg) => (
          <label
            key={cfg.id}
            className={cn(
              'flex items-center gap-4 border-2 rounded-lg px-4 py-3.5 cursor-pointer transition-colors',
              method === cfg.id ? 'border-black bg-white' : 'border-gray-light hover:border-gray-text/50',
            )}
          >
            <input
              type="radio"
              name="payment_method"
              value={cfg.id}
              checked={method === cfg.id}
              onChange={() => setMethod(cfg.id)}
              className="sr-only"
            />
            <RadioCircle selected={method === cfg.id} />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-none">{cfg.label}</p>
              <p className="text-xs text-gray-text mt-0.5">{cfg.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Instructions panel */}
      {selectedConfig && (
        <div className="bg-gray-bg rounded-lg border border-gray-light px-4 py-4">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-red-600 mb-3">
            Instrucciones de pago — {selectedConfig.label}
          </p>

          {(() => {
            const fields = selectedConfig.getFields(paymentConfig)
            return fields.length > 0 ? (
              <div className="flex flex-col gap-2 mb-3">
                {fields.map((f) => (
                  <div key={f.label} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-text shrink-0">{f.label}</span>
                    <span className="font-medium text-black text-right break-all">{f.value}</span>
                  </div>
                ))}
              </div>
            ) : null
          })()}

          {/* Note: custom from DB or fallback to hardcoded default */}
          {(() => {
            const note = selectedConfig.getNote(paymentConfig) || selectedConfig.defaultNote
            return note ? (
              <p className="text-xs text-gray-text leading-relaxed border-t border-gray-light pt-3 mt-1">
                {note}
              </p>
            ) : null
          })()}

          {/* Instruction images */}
          {(() => {
            const images = selectedConfig.getImages(paymentConfig)
            return images.length > 0 ? (
              <div className="mt-4 border-t border-gray-light pt-3">
                <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2">
                  Guía visual de pago
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, idx) => (
                    <div key={url} className="shrink-0 w-36 rounded border border-gray-light overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Paso ${idx + 1}`} className="w-full aspect-video object-cover" />
                      <p className="text-center text-[10px] font-heading font-bold text-gray-text py-1">
                        Paso {idx + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* Price panel — changes based on selected method */}
      {DIVISA_METHODS.includes(method) && hasDivisa ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-green-700 mb-2">
            💵 Monto a pagar en {selectedConfig?.label}
          </p>
          <p className="text-xl font-heading font-bold text-green-800">{formatPrice(divisaTotal, 'USD')}</p>
          <p className="text-xs text-green-600 mt-0.5">Precio en dólares (USD)</p>
        </div>
      ) : (
        <div className="bg-gray-bg border border-gray-light rounded-lg px-4 py-3">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2">
            Monto a pagar
          </p>
          <p className="text-xl font-heading font-bold text-black">{formatPrice(total, currency)}</p>
          <p className="text-xs text-gray-text mt-0.5">{bcvNote}</p>
          {bcvRate != null && (
            <p className="text-sm font-heading font-semibold text-black mt-2">
              ≈ {formatBs(total, bcvRate)}
              <span className="text-xs font-normal text-gray-text ml-1">(Tasa BCV hoy)</span>
            </p>
          )}
        </div>
      )}

      {error && <ErrorBox message={error} />}

      <button
        type="button"
        disabled={loading}
        onClick={() => setConfirmCallback(() => () => onSubmit(method))}
        className="w-full py-4 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors disabled:opacity-50"
      >
        {loading ? <Spinner /> : DIVISA_METHODS.includes(method) && hasDivisa
          ? `CONFIRMAR PEDIDO — ${formatPrice(divisaTotal, 'USD')} →`
          : `CONFIRMAR PEDIDO — ${formatPrice(total, currency)} →`}
      </button>

      <button type="button" onClick={onBack} className="w-full py-3 text-sm text-gray-text hover:text-black transition-colors">
        ← Volver al método de entrega
      </button>

      {confirmCallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
            <p className="font-heading font-bold text-black mb-3">Antes de confirmar</p>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              En la siguiente ventana debes cargar el comprobante de pago, asegúrate de tener todos los datos del pago que vas a realizar antes de confirmar el pedido.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { confirmCallback(); setConfirmCallback(null) }}
                className="w-full py-3 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
              >
                ENTENDIDO, CONFIRMAR →
              </button>
              <button
                type="button"
                onClick={() => setConfirmCallback(null)}
                className="w-full py-2.5 text-sm text-gray-text hover:text-black transition-colors"
              >
                Cancelar, revisar datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShippingSummary({ shippingData, onBack }: { shippingData: ShippingFormData; onBack: () => void }) {
  return (
    <div className="bg-gray-bg rounded-lg px-4 py-3 flex items-start justify-between gap-4 text-sm">
      <div>
        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">Envío a</p>
        <p className="font-medium">{shippingData.name}</p>
        <p className="text-gray-text text-xs">{shippingData.address_line}, {shippingData.city}</p>
        <p className="text-gray-text text-xs">{shippingData.email} · {shippingData.phone}</p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-accent underline underline-offset-2 hover:text-black transition-colors shrink-0 mt-0.5"
      >
        Cambiar
      </button>
    </div>
  )
}

function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <div className={cn(
      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
      selected ? 'border-black' : 'border-gray-light',
    )}>
      {selected && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-sm text-sale bg-red-50 border border-red-200 rounded px-4 py-3">{message}</p>
  )
}

function Spinner() {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Procesando...
    </span>
  )
}
