'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { updateSettingAction } from '../actions'
import type { AdminSetting } from '../types'

// ---------------------------------------------------------------------------
// Static metadata per setting key
// ---------------------------------------------------------------------------

type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea'

type SettingMeta = {
  label: string
  description: string
  impact: string[]
  type: FieldType
  prefix?: string
  suffix?: string
  placeholder?: string
}

const META: Record<string, SettingMeta> = {
  store_name: {
    label: 'Nombre de la tienda',
    description: 'Nombre oficial de la marca. Se usa en el asunto de los emails y en los metadatos de SEO.',
    impact: ['Emails', 'SEO'],
    type: 'text',
    placeholder: 'SAVAYA',
  },
  store_tagline: {
    label: 'Tagline',
    description: 'Frase corta que resume la propuesta de valor de la marca.',
    impact: ['Footer'],
    type: 'text',
    placeholder: 'Marca tu moda',
  },
  store_email: {
    label: 'Email de contacto',
    description: 'Recibe las notificaciones de nuevos pedidos y pagos pendientes. También aparece como email de soporte.',
    impact: ['Emails', 'Footer'],
    type: 'email',
    placeholder: 'noreply@savayavzla.com',
  },
  store_instagram: {
    label: 'Instagram',
    description: 'Nombre de usuario sin @. Genera el enlace hacia el perfil en el footer.',
    impact: ['Footer'],
    type: 'text',
    prefix: '@',
    placeholder: 'Savayavzla',
  },
  store_whatsapp: {
    label: 'WhatsApp de atención',
    description: 'Número completo con código de país, sin + ni espacios. Se usa en el botón de soporte.',
    impact: ['Footer', 'Checkout'],
    type: 'tel',
    placeholder: '584141100100',
  },
  store_address: {
    label: 'Dirección física',
    description: 'Dirección del local o bodega. Aparece en el footer y en los emails de confirmación de pedido.',
    impact: ['Footer', 'Emails'],
    type: 'textarea',
    placeholder: 'CC Multi Tienda God is Good, local A-4, Valencia, Carabobo',
  },
  order_number_prefix: {
    label: 'Prefijo del número de pedido',
    description: 'Letras que encabezan cada número de pedido. Ej: con "SAV-" el primer pedido es SAV-00001.',
    impact: ['Pedidos', 'Emails'],
    type: 'text',
    placeholder: 'SAV-',
  },
  reservation_expiry_hours: {
    label: 'Tiempo de reserva de inventario',
    description: 'Horas que el stock queda bloqueado esperando el comprobante de pago. Si el cliente no sube el comprobante en este tiempo, el pedido se cancela y el stock se libera.',
    impact: ['Checkout', 'Inventario'],
    type: 'number',
    suffix: 'horas',
    placeholder: '2',
  },
  partial_payment_options: {
    label: 'Opciones de pago parcial',
    description: 'Porcentajes disponibles como adelanto inicial cuando el cliente paga a cuotas. Escríbelos separados por coma.',
    impact: ['Checkout'],
    type: 'text',
    placeholder: '20,35,50',
    suffix: '%',
  },
  free_shipping_threshold_usd: {
    label: 'Monto mínimo para envío gratis',
    description: 'Si el subtotal del pedido supera este monto, el envío es gratuito. La barra de progreso del carrito apunta a este número.',
    impact: ['Carrito', 'Checkout'],
    type: 'number',
    prefix: '$',
    suffix: 'USD',
    placeholder: '50',
  },
  standard_shipping_cost_usd: {
    label: 'Costo envío estándar',
    description: 'Tarifa base de envío cuando el pedido no alcanza el mínimo para envío gratis.',
    impact: ['Checkout'],
    type: 'number',
    prefix: '$',
    suffix: 'USD',
    placeholder: '5',
  },
  express_shipping_cost_usd: {
    label: 'Costo envío express',
    description: 'Tarifa del envío rápido. El cliente puede elegir esta opción en el paso de envío del checkout.',
    impact: ['Checkout'],
    type: 'number',
    prefix: '$',
    suffix: 'USD',
    placeholder: '10',
  },
  low_stock_threshold: {
    label: 'Umbral de alerta de stock bajo',
    description: 'Cuando una variante tiene esta cantidad de unidades o menos, se marca en rojo en el inventario y aparece en la alerta del dashboard.',
    impact: ['Admin', 'Inventario'],
    type: 'number',
    suffix: 'unidades',
    placeholder: '5',
  },
  usdt_policy: {
    label: 'Instrucciones de pago USDT',
    description: 'Texto que ve el cliente cuando elige pagar con USDT TRC-20. Incluye la dirección del wallet y cualquier instrucción adicional.',
    impact: ['Checkout'],
    type: 'textarea',
    placeholder: 'Envía al wallet TRC-20: T...',
  },
}

const IMPACT_STYLE: Record<string, string> = {
  Footer:      'bg-blue-500/15 text-blue-300',
  Emails:      'bg-purple-500/15 text-purple-300',
  Checkout:    'bg-amber-500/15 text-amber-400',
  Carrito:     'bg-amber-500/15 text-amber-400',
  Pedidos:     'bg-cyan-500/15 text-cyan-300',
  Admin:       'bg-surface-2 text-text-secondary border border-border',
  Inventario:  'bg-green-500/15 text-green-300',
  SEO:         'bg-teal-500/15 text-teal-300',
}

// ---------------------------------------------------------------------------
// Groups with icons
// ---------------------------------------------------------------------------

type Group = {
  label: string
  description: string
  icon: React.ReactNode
  keys: string[]
}

function IconStore() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 2.289a.98.98 0 01-.196.918c-.225.225-.516.343-.808.343H4.131c-.292 0-.583-.118-.808-.343z" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function IconTruck() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  )
}

function IconChartBar() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function IconCreditCard() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

const GROUPS: Group[] = [
  {
    label: 'Datos de la tienda',
    description: 'Información básica de la marca que aparece en el footer, emails y SEO.',
    icon: <IconStore />,
    keys: ['store_name', 'store_tagline', 'store_email', 'store_instagram', 'store_whatsapp', 'store_address'],
  },
  {
    label: 'Pedidos',
    description: 'Reglas que controlan cómo se crean y gestionan los pedidos.',
    icon: <IconBox />,
    keys: ['order_number_prefix', 'reservation_expiry_hours', 'partial_payment_options'],
  },
  {
    label: 'Envío',
    description: 'Tarifas y condiciones de envío que ve el cliente en el checkout.',
    icon: <IconTruck />,
    keys: ['free_shipping_threshold_usd', 'standard_shipping_cost_usd', 'express_shipping_cost_usd'],
  },
  {
    label: 'Inventario',
    description: 'Umbrales que activan alertas automáticas en el panel de admin.',
    icon: <IconChartBar />,
    keys: ['low_stock_threshold'],
  },
  {
    label: 'Pagos',
    description: 'Textos e instrucciones mostrados al cliente durante el pago.',
    icon: <IconCreditCard />,
    keys: ['usdt_policy'],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls =
  'flex-1 min-w-0 h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold'

const textareaCls =
  'flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold resize-y min-h-[72px]'

function displayValue(key: string, value: string): string {
  const meta = META[key]
  if (!meta) return value
  const parts: string[] = []
  if (meta.prefix) parts.push(meta.prefix)
  parts.push(value || '—')
  if (meta.suffix) parts.push(meta.suffix)
  return parts.join(' ')
}

// ---------------------------------------------------------------------------
// Setting row
// ---------------------------------------------------------------------------

function SettingRow({
  setting,
  canEdit,
  onSaved,
}: {
  setting: AdminSetting
  canEdit: boolean
  onSaved: (key: string, value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(setting.value)
  const [isPending, startTransition] = useTransition()

  const meta = META[setting.key]
  const fieldType = meta?.type ?? 'text'
  const isTextarea = fieldType === 'textarea'

  function handleSave() {
    startTransition(async () => {
      const res = await updateSettingAction(setting.key, draft)
      if (res.success) {
        onSaved(setting.key, draft)
        setEditing(false)
        toast.success('Guardado')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleCancel() {
    setDraft(setting.value)
    setEditing(false)
  }

  return (
    <div className="px-5 py-4 border-b border-border last:border-b-0">
      {/* Top: label + impact tags */}
      <div className="flex items-start gap-3 mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-snug">
            {meta?.label ?? setting.key}
          </p>
          {meta?.description && (
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              {meta.description}
            </p>
          )}
        </div>
        {meta?.impact && (
          <div className="flex gap-1 flex-wrap shrink-0 mt-0.5">
            {meta.impact.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none ${
                  IMPACT_STYLE[tag] ?? 'bg-surface-2 text-text-secondary'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: value display or edit input */}
      {editing ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-start gap-2">
            {meta?.prefix && !isTextarea && (
              <span className="h-9 flex items-center text-sm text-text-secondary font-mono shrink-0">
                {meta.prefix}
              </span>
            )}
            {isTextarea ? (
              <textarea
                autoFocus
                className={textareaCls}
                value={draft}
                placeholder={meta?.placeholder}
                onChange={(e) => setDraft(e.target.value)}
              />
            ) : (
              <input
                autoFocus
                type={fieldType === 'number' ? 'number' : fieldType}
                className={inputCls}
                value={draft}
                placeholder={meta?.placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isTextarea) handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
            )}
            {meta?.suffix && !isTextarea && (
              <span className="h-9 flex items-center text-sm text-text-secondary shrink-0">
                {meta.suffix}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" isLoading={isPending} onClick={handleSave}>
              Guardar
            </Button>
            <button
              onClick={handleCancel}
              className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md hover:bg-surface-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm font-mono text-text-primary bg-surface-2 border border-border rounded-md px-2.5 py-1 flex-1 min-w-0 truncate">
            {displayValue(setting.key, setting.value)}
          </span>
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-xs font-medium text-text-secondary hover:text-accent-gold px-2.5 py-1 rounded-md border border-border hover:border-accent-gold/50 transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SettingsManager
// ---------------------------------------------------------------------------

type Props = {
  initialSettings: AdminSetting[]
  canEdit: boolean
}

export function SettingsManager({ initialSettings, canEdit }: Props) {
  const [settings, setSettings] = useState(initialSettings)

  function handleSaved(key: string, value: string) {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)))
  }

  const settingMap = new Map(settings.map((s) => [s.key, s]))

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Configuración</h1>
        <p className="text-sm text-text-secondary">
          Parámetros generales de la tienda. Los cambios son inmediatos y no requieren redespliegue.
        </p>
      </div>

      {!canEdit && (
        <div className="border border-border rounded-xl px-5 py-3 mb-6 text-xs text-text-secondary bg-surface/50">
          Vista de solo lectura. Necesitas permiso{' '}
          <span className="font-semibold">settings:write</span> para editar.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {GROUPS.map((group) => {
          const groupSettings = group.keys
            .map((key) => settingMap.get(key))
            .filter((s): s is AdminSetting => s !== undefined)

          if (groupSettings.length === 0) return null

          return (
            <div key={group.label} className="border border-border rounded-xl overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-3.5 border-b border-border bg-surface-2/50 flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold mt-0.5">
                  {group.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{group.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{group.description}</p>
                </div>
              </div>

              {/* Settings */}
              <div className="divide-y divide-border">
                {groupSettings.map((s) => (
                  <SettingRow
                    key={s.key}
                    setting={s}
                    canEdit={canEdit}
                    onSaved={handleSaved}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Catch-all for unknown keys */}
        {(() => {
          const known = new Set(GROUPS.flatMap((g) => g.keys))
          const rest = settings.filter((s) => !known.has(s.key))
          if (rest.length === 0) return null
          return (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-surface-2/50">
                <p className="text-sm font-semibold text-text-primary">Otros</p>
              </div>
              <div className="divide-y divide-border">
                {rest.map((s) => (
                  <SettingRow key={s.key} setting={s} canEdit={canEdit} onSaved={handleSaved} />
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
