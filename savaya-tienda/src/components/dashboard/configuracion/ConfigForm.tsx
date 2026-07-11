'use client'

import { useState, useTransition, useRef } from 'react'
import { saveStoreSettings } from './actions'
import type { StoreSettings, PaymentConfigDB, ShippingPrices } from '@/lib/types'

const ALL_SHIPPING_COMPANIES = [
  { id: 'zoom',   label: 'Zoom',   desc: 'Cobertura nacional, sucursales en todo el país' },
  { id: 'tealca', label: 'Tealca', desc: 'Envíos rápidos y seguros a nivel nacional' },
  { id: 'mrw',    label: 'MRW',    desc: 'Red de agencias con entrega a domicilio' },
] as const

const CARABOBO_MUNICIPALITIES = [
  'Valencia', 'Naguanagua', 'San Diego', 'Libertador', 'Los Guayos',
  'Guacara', 'San Joaquín', 'Bejuma', 'Montalbán', 'Miranda',
  'Puerto Cabello', 'Carlos Arvelo', 'Diego Ibarra', 'Juan José Mora',
] as const

const ALL_PAYMENT_METHODS = [
  { id: 'zelle', label: 'Zelle', desc: 'Transferencia en dólares (USD)' },
  { id: 'binance', label: 'Binance Pay', desc: 'Paga con cualquier cripto vía Binance' },
  { id: 'usdt', label: 'USDT — Red TRC20', desc: 'Tether USD en red TRON' },
  { id: 'bank_transfer_ve', label: 'Transferencia bancaria (VE)', desc: 'Bancos venezolanos en Bolívares' },
  { id: 'pago_movil', label: 'Pago Móvil', desc: 'Pago móvil interbancario' },
  { id: 'efectivo', label: 'Efectivo / Retiro en tienda', desc: 'Pago en efectivo o al retirar' },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading font-semibold text-sm text-black uppercase tracking-wider mb-4">
      {children}
    </h2>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-heading font-medium text-black mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
    />
  )
}

// ─── Image upload grid for payment instructions ────────────────────────────────

function PaymentImagesUpload({
  images,
  onChange,
}: {
  images: string[]
  onChange: (imgs: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadError('')
    setUploading(true)

    const results: string[] = []
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/api/upload?folder=savaya/pagos', { method: 'POST', body: form })
        const data = await res.json() as { url?: string; error?: string }
        if (!res.ok || !data.url) {
          setUploadError(data.error ?? 'Error al subir imagen')
          continue
        }
        results.push(data.url)
      } catch {
        setUploadError('Error de conexión al subir imagen')
      }
    }

    setUploading(false)
    if (results.length > 0) onChange([...images, ...results])
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-text">
        Sube capturas de pantalla o fotos que expliquen el proceso de pago. Se mostrarán como guía visual al cliente.
      </p>

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={url} className="relative group aspect-video rounded border border-gray-light overflow-hidden bg-gray-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Paso ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <span className="text-white text-xs font-bold">Paso {idx + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                title="Eliminar imagen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-light rounded text-sm text-gray-text hover:border-black hover:text-black transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-gray-text/30 border-t-gray-text rounded-full animate-spin shrink-0" />
            Subiendo…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Agregar imágenes
          </>
        )}
      </button>
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  )
}

// ─── Payment method sub-state type ───────────────────────────────────────────

interface MethodExtra {
  note: string
  images: string[]
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConfigForm({ initialSettings }: { initialSettings: StoreSettings | null }) {
  const s = initialSettings

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Basic settings
  const [whatsapp, setWhatsapp] = useState(s?.whatsapp_number ?? '573001234567')
  const [email, setEmail] = useState(s?.store_email ?? 'Savayarrss@gmail.com')

  // Address
  const [address, setAddress] = useState(s?.store_address ?? '')
  const [city, setCity] = useState(s?.store_city ?? '')
  const [department, setDepartment] = useState(s?.store_department ?? '')

  // Payment config (typed per method)
  const pc = s?.payment_config ?? {}

  const [zelle, setZelle] = useState({
    titular: pc.zelle?.titular ?? '',
    email_phone: pc.zelle?.email_phone ?? '',
    note: pc.zelle?.note ?? '',
    images: pc.zelle?.images ?? [],
  })
  const [binance, setBinance] = useState({
    pay_id: pc.binance?.pay_id ?? '',
    note: pc.binance?.note ?? '',
    images: pc.binance?.images ?? [],
  })
  const [usdt, setUsdt] = useState({
    address: pc.usdt?.address ?? '',
    note: pc.usdt?.note ?? '',
    images: pc.usdt?.images ?? [],
  })
  const [bankVe, setBankVe] = useState({
    banco: pc.bank_transfer_ve?.banco ?? '',
    tipo: pc.bank_transfer_ve?.tipo ?? '',
    numero: pc.bank_transfer_ve?.numero ?? '',
    titular: pc.bank_transfer_ve?.titular ?? '',
    ci: pc.bank_transfer_ve?.ci ?? '',
    ci_type: (pc.bank_transfer_ve?.ci_type ?? 'ci') as 'ci' | 'rif',
    note: pc.bank_transfer_ve?.note ?? '',
    images: pc.bank_transfer_ve?.images ?? [],
  })
  const [pagoMovil, setPagoMovil] = useState({
    banco: pc.pago_movil?.banco ?? '',
    telefono: pc.pago_movil?.telefono ?? '',
    ci: pc.pago_movil?.ci ?? '',
    ci_type: (pc.pago_movil?.ci_type ?? 'ci') as 'ci' | 'rif',
    note: pc.pago_movil?.note ?? '',
    images: pc.pago_movil?.images ?? [],
  })
  const [efectivo, setEfectivo] = useState<MethodExtra>({
    note: pc.efectivo?.note ?? '',
    images: pc.efectivo?.images ?? [],
  })

  const [wholesaleMinQty, setWholesaleMinQty] = useState(s?.wholesale_min_qty ?? 6)
  const [currency, setCurrency] = useState(s?.store_currency ?? 'EUR')

  const [enabledMethods, setEnabledMethods] = useState<string[]>(
    s?.enabled_payment_methods ?? ALL_PAYMENT_METHODS.map((m) => m.id)
  )
  const [enabledShipping, setEnabledShipping] = useState<string[]>(
    s?.enabled_shipping_companies ?? ALL_SHIPPING_COMPANIES.map((c) => c.id)
  )

  const spAgency = s?.shipping_prices?.agency ?? {}
  const spDelivery = s?.shipping_prices?.delivery ?? {}
  const [agencyFree, setAgencyFree] = useState({
    zoom:   spAgency.zoom   === 0,
    tealca: spAgency.tealca === 0,
    mrw:    spAgency.mrw    === 0,
  })
  const [agencyPrices, setAgencyPrices] = useState({
    zoom:   spAgency.zoom   !== undefined && spAgency.zoom   !== 0 ? String(spAgency.zoom)   : '',
    tealca: spAgency.tealca !== undefined && spAgency.tealca !== 0 ? String(spAgency.tealca) : '',
    mrw:    spAgency.mrw    !== undefined && spAgency.mrw    !== 0 ? String(spAgency.mrw)    : '',
  })
  const [deliveryPrices, setDeliveryPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      CARABOBO_MUNICIPALITIES.map((m) => [m, spDelivery[m] !== undefined ? String(spDelivery[m]) : ''])
    )
  )

  function toggleMethod(id: string) {
    setEnabledMethods((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id])
  }
  function toggleShipping(id: string) {
    setEnabledShipping((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setError(null)

    const payment_config: PaymentConfigDB = {
      zelle: { titular: zelle.titular, email_phone: zelle.email_phone, note: zelle.note, images: zelle.images },
      binance: { pay_id: binance.pay_id, note: binance.note, images: binance.images },
      usdt: { address: usdt.address, note: usdt.note, images: usdt.images },
      bank_transfer_ve: { banco: bankVe.banco, tipo: bankVe.tipo, numero: bankVe.numero, titular: bankVe.titular, ci: bankVe.ci, ci_type: bankVe.ci_type, note: bankVe.note, images: bankVe.images },
      pago_movil: { banco: pagoMovil.banco, telefono: pagoMovil.telefono, ci: pagoMovil.ci, ci_type: pagoMovil.ci_type, note: pagoMovil.note, images: pagoMovil.images },
      efectivo: { note: efectivo.note, images: efectivo.images },
    }

    const shipping_prices: ShippingPrices = {
      agency: Object.fromEntries(
        (['zoom', 'tealca', 'mrw'] as const)
          .filter((k) => agencyFree[k] || (agencyPrices[k].trim() && !isNaN(parseFloat(agencyPrices[k]))))
          .map((k) => [k, agencyFree[k] ? 0 : parseFloat(agencyPrices[k])])
      ),
      delivery: Object.fromEntries(
        CARABOBO_MUNICIPALITIES
          .filter((m) => deliveryPrices[m]?.trim() && !isNaN(parseFloat(deliveryPrices[m])))
          .map((m) => [m, parseFloat(deliveryPrices[m])])
      ),
    }

    startTransition(async () => {
      const result = await saveStoreSettings({
        whatsapp_number: whatsapp,
        store_email: email,
        store_address: address,
        store_city: city,
        store_department: department,
        payment_config,
        enabled_payment_methods: enabledMethods,
        enabled_shipping_companies: enabledShipping,
        shipping_prices,
        wholesale_min_qty: wholesaleMinQty,
        store_currency: currency,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* ── Contacto ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6 space-y-5">
        <SectionTitle>Contacto y comunicaciones</SectionTitle>
        <Field label="Número de WhatsApp">
          <p className="text-xs text-gray-text mb-2">Sin espacios ni guiones. Con código de país (ej: 573001234567).</p>
          <TextInput value={whatsapp} onChange={setWhatsapp} placeholder="573001234567" />
        </Field>
        <Field label="Email de la tienda">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Savayarrss@gmail.com"
            className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </Field>
      </div>

      {/* ── Precio al mayor ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6 space-y-5">
        <SectionTitle>Precio al mayor</SectionTitle>
        <Field label="Cantidad mínima de pares para precio al mayor">
          <p className="text-xs text-gray-text mb-2">
            Cuando el total de pares en el carrito alcance esta cantidad, los productos con precio al mayor lo aplicarán automáticamente.
          </p>
          <input
            type="number"
            min={1}
            step={1}
            value={wholesaleMinQty}
            onChange={(e) => setWholesaleMinQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-32 h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
          />
          <p className="text-xs text-gray-text mt-1">Valor actual: {wholesaleMinQty} pares o más activan el precio al mayor</p>
        </Field>
      </div>

      {/* ── Moneda ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6 space-y-4">
        <SectionTitle>Moneda de la tienda</SectionTitle>
        <p className="text-xs text-gray-text -mt-2">
          Define la moneda que se muestra en precios, checkout y facturación de toda la tienda.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: 'EUR', label: 'Euro', symbol: '€' },
            { value: 'USD', label: 'Dólar', symbol: '$' },
            { value: 'BS',  label: 'Bolívar', symbol: 'Bs.' },
          ] as const).map(({ value, label, symbol }) => {
            const selected = currency === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCurrency(value)}
                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-lg border-2 transition-colors ${
                  selected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-light bg-white text-black hover:border-gray-text'
                }`}
              >
                <span className="text-2xl font-heading font-bold leading-none">{symbol}</span>
                <span className="text-xs font-heading font-semibold uppercase tracking-wider">{value}</span>
                <span className="text-xs opacity-70">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Dirección ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6 space-y-5">
        <SectionTitle>Dirección de la tienda</SectionTitle>
        <Field label="Dirección">
          <TextInput value={address} onChange={setAddress} placeholder="Calle 10 #5-30, Local 2" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ciudad">
            <TextInput value={city} onChange={setCity} placeholder="Barranquilla" />
          </Field>
          <Field label="Departamento / Estado">
            <TextInput value={department} onChange={setDepartment} placeholder="Atlántico" />
          </Field>
        </div>
      </div>

      {/* ── Métodos activos ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <SectionTitle>Métodos de pago activos</SectionTitle>
        <p className="text-xs text-gray-text -mt-2 mb-5">
          Activa o desactiva los métodos disponibles para los clientes en el checkout.
        </p>
        <div className="space-y-1">
          {ALL_PAYMENT_METHODS.map(({ id, label, desc }) => {
            const active = enabledMethods.includes(id)
            return (
              <div key={id} className="flex items-center justify-between py-3 border-b border-gray-light last:border-0">
                <div>
                  <p className="text-sm font-heading font-medium text-black">{label}</p>
                  <p className="text-xs text-gray-text">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMethod(id)}
                  aria-label={`${active ? 'Desactivar' : 'Activar'} ${label}`}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${active ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${active ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Datos de pago ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6 space-y-6">
        <div>
          <SectionTitle>Datos de pago</SectionTitle>
          <p className="text-xs text-gray-text -mt-2">
            Esta información aparece en el checkout cuando el cliente selecciona cada método de pago.
          </p>
        </div>

        {/* Zelle */}
        <PaymentSection label="Zelle" desc="Transferencia en dólares (USD)">
          <Field label="Titular (nombre completo)">
            <TextInput value={zelle.titular} onChange={(v) => setZelle((p) => ({ ...p, titular: v }))} placeholder="Juan Pérez" />
          </Field>
          <Field label="Email o Teléfono Zelle">
            <TextInput value={zelle.email_phone} onChange={(v) => setZelle((p) => ({ ...p, email_phone: v }))} placeholder="juan@example.com" />
          </Field>
          <InstructionsSection
            note={zelle.note}
            images={zelle.images}
            onNoteChange={(v) => setZelle((p) => ({ ...p, note: v }))}
            onImagesChange={(imgs) => setZelle((p) => ({ ...p, images: imgs }))}
          />
        </PaymentSection>

        {/* Binance */}
        <PaymentSection label="Binance Pay" desc="Paga con cualquier cripto vía Binance">
          <Field label="Pay ID de Binance">
            <TextInput value={binance.pay_id} onChange={(v) => setBinance((p) => ({ ...p, pay_id: v }))} placeholder="123456789" />
          </Field>
          <InstructionsSection
            note={binance.note}
            images={binance.images}
            onNoteChange={(v) => setBinance((p) => ({ ...p, note: v }))}
            onImagesChange={(imgs) => setBinance((p) => ({ ...p, images: imgs }))}
          />
        </PaymentSection>

        {/* USDT */}
        <PaymentSection label="USDT — Red TRC20" desc="Tether USD en red TRON">
          <Field label="Dirección de wallet TRC20">
            <TextInput value={usdt.address} onChange={(v) => setUsdt((p) => ({ ...p, address: v }))} placeholder="TXxx..." />
          </Field>
          <InstructionsSection
            note={usdt.note}
            images={usdt.images}
            onNoteChange={(v) => setUsdt((p) => ({ ...p, note: v }))}
            onImagesChange={(imgs) => setUsdt((p) => ({ ...p, images: imgs }))}
          />
        </PaymentSection>

        {/* Transferencia bancaria VE */}
        <PaymentSection label="Transferencia bancaria (VE)" desc="Bancos venezolanos en Bolívares">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Banco">
              <TextInput value={bankVe.banco} onChange={(v) => setBankVe((p) => ({ ...p, banco: v }))} placeholder="Banesco" />
            </Field>
            <Field label="Tipo de cuenta">
              <TextInput value={bankVe.tipo} onChange={(v) => setBankVe((p) => ({ ...p, tipo: v }))} placeholder="Corriente / Ahorros" />
            </Field>
          </div>
          <Field label="Número de cuenta">
            <TextInput value={bankVe.numero} onChange={(v) => setBankVe((p) => ({ ...p, numero: v }))} placeholder="0134-0000-00-0000000000" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Titular">
              <TextInput value={bankVe.titular} onChange={(v) => setBankVe((p) => ({ ...p, titular: v }))} placeholder="Juan Pérez" />
            </Field>
            <Field label={bankVe.ci_type === 'rif' ? 'RIF' : 'Cédula (CI)'}>
              <div className="flex gap-2">
                <div className="flex rounded border border-gray-light overflow-hidden shrink-0 text-xs font-heading font-bold">
                  <button type="button"
                    onClick={() => setBankVe((p) => ({ ...p, ci_type: 'ci' }))}
                    className={`px-2.5 py-2 transition-colors ${bankVe.ci_type !== 'rif' ? 'bg-black text-white' : 'text-gray-text hover:text-black'}`}
                  >CI</button>
                  <button type="button"
                    onClick={() => setBankVe((p) => ({ ...p, ci_type: 'rif' }))}
                    className={`px-2.5 py-2 transition-colors ${bankVe.ci_type === 'rif' ? 'bg-black text-white' : 'text-gray-text hover:text-black'}`}
                  >RIF</button>
                </div>
                <TextInput value={bankVe.ci} onChange={(v) => setBankVe((p) => ({ ...p, ci: v }))} placeholder={bankVe.ci_type === 'rif' ? 'J-12345678-9' : 'V-12345678'} />
              </div>
            </Field>
          </div>
          <InstructionsSection
            note={bankVe.note}
            images={bankVe.images}
            onNoteChange={(v) => setBankVe((p) => ({ ...p, note: v }))}
            onImagesChange={(imgs) => setBankVe((p) => ({ ...p, images: imgs }))}
          />
        </PaymentSection>

        {/* Pago móvil */}
        <PaymentSection label="Pago Móvil" desc="Pago móvil interbancario">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Banco">
              <TextInput value={pagoMovil.banco} onChange={(v) => setPagoMovil((p) => ({ ...p, banco: v }))} placeholder="Banesco" />
            </Field>
            <Field label="Teléfono">
              <TextInput value={pagoMovil.telefono} onChange={(v) => setPagoMovil((p) => ({ ...p, telefono: v }))} placeholder="0412-0000000" />
            </Field>
            <Field label={pagoMovil.ci_type === 'rif' ? 'RIF' : 'Cédula (CI)'}>
              <div className="flex gap-2">
                <div className="flex rounded border border-gray-light overflow-hidden shrink-0 text-xs font-heading font-bold">
                  <button type="button"
                    onClick={() => setPagoMovil((p) => ({ ...p, ci_type: 'ci' }))}
                    className={`px-2.5 py-2 transition-colors ${pagoMovil.ci_type !== 'rif' ? 'bg-black text-white' : 'text-gray-text hover:text-black'}`}
                  >CI</button>
                  <button type="button"
                    onClick={() => setPagoMovil((p) => ({ ...p, ci_type: 'rif' }))}
                    className={`px-2.5 py-2 transition-colors ${pagoMovil.ci_type === 'rif' ? 'bg-black text-white' : 'text-gray-text hover:text-black'}`}
                  >RIF</button>
                </div>
                <TextInput value={pagoMovil.ci} onChange={(v) => setPagoMovil((p) => ({ ...p, ci: v }))} placeholder={pagoMovil.ci_type === 'rif' ? 'J-12345678-9' : 'V-12345678'} />
              </div>
            </Field>
          </div>
          <InstructionsSection
            note={pagoMovil.note}
            images={pagoMovil.images}
            onNoteChange={(v) => setPagoMovil((p) => ({ ...p, note: v }))}
            onImagesChange={(imgs) => setPagoMovil((p) => ({ ...p, images: imgs }))}
          />
        </PaymentSection>

        {/* Efectivo */}
        <PaymentSection label="Efectivo / Retiro en tienda" desc="Pago en efectivo o al retirar">
          <InstructionsSection
            note={efectivo.note}
            images={efectivo.images}
            onNoteChange={(v) => setEfectivo((p) => ({ ...p, note: v }))}
            onImagesChange={(imgs) => setEfectivo((p) => ({ ...p, images: imgs }))}
          />
        </PaymentSection>
      </div>

      {/* ── Empresas de envío ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <SectionTitle>Empresas de envío activas</SectionTitle>
        <p className="text-xs text-gray-text -mt-2 mb-5">
          Activa o desactiva las empresas disponibles en el checkout cuando el cliente elige retirar en agencia.
        </p>
        <div className="space-y-1">
          {ALL_SHIPPING_COMPANIES.map(({ id, label, desc }) => {
            const active = enabledShipping.includes(id)
            return (
              <div key={id} className="flex items-center justify-between py-3 border-b border-gray-light last:border-0">
                <div>
                  <p className="text-sm font-heading font-medium text-black">{label}</p>
                  <p className="text-xs text-gray-text">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleShipping(id)}
                  aria-label={`${active ? 'Desactivar' : 'Activar'} ${label}`}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${active ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Precios de envío ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-light p-6 space-y-6">
        <div>
          <SectionTitle>Precios de envío</SectionTitle>
          <p className="text-xs text-gray-text -mt-2">
            Precios en {currency === 'EUR' ? 'euros (€)' : currency === 'USD' ? 'dólares ($)' : 'bolívares (Bs.)'}. Los clientes ven el precio calculado según su ciudad o municipio.
          </p>
        </div>

        {/* Agency — flat price per company */}
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
            Agencia de envío — precio por empresa
          </p>
          <p className="text-xs text-gray-text mb-4">
            El cliente verá el precio de la empresa que seleccione al momento del pago. Activa "Gratis" para ofrecer envío sin costo por esa empresa.
          </p>
          <div className="space-y-0">
            {([
              { key: 'zoom',   label: 'Zoom' },
              { key: 'tealca', label: 'Tealca' },
              { key: 'mrw',    label: 'MRW' },
            ] as const).map(({ key, label }) => {
              const isFree = agencyFree[key]
              return (
                <div key={key} className="flex items-center gap-3 py-3 border-b border-gray-light last:border-0">
                  <p className="flex-1 text-sm font-medium">{label}</p>

                  {/* Free shipping toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAgencyFree((prev) => ({ ...prev, [key]: !prev[key] }))}
                      aria-label={`${isFree ? 'Quitar' : 'Activar'} envío gratuito para ${label}`}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${isFree ? 'bg-green-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${isFree ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-heading font-semibold w-10 ${isFree ? 'text-green-600' : 'text-gray-text'}`}>
                      {isFree ? 'Gratis' : 'Precio'}
                    </span>
                  </div>

                  {/* Price input — disabled when free */}
                  <div className={`flex items-center h-9 border rounded px-3 gap-1 text-sm transition-colors ${isFree ? 'border-gray-light bg-gray-bg opacity-40 cursor-not-allowed' : 'border-gray-light focus-within:border-black'}`}>
                    <span className="text-gray-text shrink-0">{currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'Bs.'}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isFree}
                      value={isFree ? '' : agencyPrices[key]}
                      onChange={(e) => setAgencyPrices((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={isFree ? '—' : '—'}
                      className="w-20 focus:outline-none disabled:cursor-not-allowed bg-transparent"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Delivery — price per Carabobo municipality */}
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
            Delivery a domicilio — precio por municipio de Carabobo
          </p>
          <p className="text-xs text-gray-text mb-4">Deja en blanco los municipios sin cobertura.</p>
          <div className="space-y-0">
            {CARABOBO_MUNICIPALITIES.map((mun) => (
              <div key={mun} className="flex items-center gap-3 py-2.5 border-b border-gray-light last:border-0">
                <p className="flex-1 text-sm">{mun}</p>
                <div className="flex items-center h-9 border border-gray-light rounded px-3 gap-1 text-sm focus-within:border-black transition-colors">
                  <span className="text-gray-text shrink-0">{currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'Bs.'}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryPrices[mun] ?? ''}
                    onChange={(e) => setDeliveryPrices((prev) => ({ ...prev, [mun]: e.target.value }))}
                    placeholder="—"
                    className="w-20 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Save button ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-6 bg-black text-white text-sm font-heading font-semibold rounded hover:bg-accent transition-colors disabled:opacity-40"
        >
          {isPending ? 'Guardando…' : 'Guardar todos los cambios'}
        </button>
        {saved && !isPending && <p className="text-sm text-green-600 font-medium">✓ Cambios guardados</p>}
        {error && !isPending && <p className="text-sm text-sale">{error}</p>}
      </div>
    </form>
  )
}

// ─── InstructionsSection — note textarea + image upload ──────────────────────

function InstructionsSection({
  note,
  images,
  onNoteChange,
  onImagesChange,
}: {
  note: string
  images: string[]
  onNoteChange: (v: string) => void
  onImagesChange: (imgs: string[]) => void
}) {
  return (
    <div className="border-t border-gray-light pt-4 mt-1 space-y-4">
      <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
        Instrucciones para el cliente
      </p>
      <div>
        <label className="block text-sm font-heading font-medium text-black mb-1.5">
          Texto de instrucciones
        </label>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Ej: Envía captura del comprobante por WhatsApp al recibir tu número de pedido."
          rows={3}
          className="w-full border border-gray-light rounded px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-heading font-medium text-black mb-1.5">
          Imágenes de guía de pago
        </label>
        <PaymentImagesUpload images={images} onChange={onImagesChange} />
      </div>
    </div>
  )
}

// ─── PaymentSection — collapsible accordion ───────────────────────────────────

function PaymentSection({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-light rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-bg transition-colors"
      >
        <div>
          <p className="text-sm font-heading font-semibold text-black">{label}</p>
          <p className="text-xs text-gray-text">{desc}</p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 shrink-0 ml-4 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-light space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}
