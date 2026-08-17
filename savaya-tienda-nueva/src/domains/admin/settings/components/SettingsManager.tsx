'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { updateSettingAction } from '../actions'
import type { AdminSetting } from '../types'

// ---------------------------------------------------------------------------
// Setting groups
// ---------------------------------------------------------------------------

type Group = { label: string; keys: string[] }

const GROUPS: Group[] = [
  {
    label: 'Datos de la tienda',
    keys: [
      'store_name',
      'store_tagline',
      'store_email',
      'store_instagram',
      'store_whatsapp',
      'store_address',
    ],
  },
  {
    label: 'Pedidos',
    keys: ['order_number_prefix', 'reservation_expiry_hours', 'partial_payment_options'],
  },
  {
    label: 'Envío',
    keys: [
      'free_shipping_threshold_usd',
      'standard_shipping_cost_usd',
      'express_shipping_cost_usd',
    ],
  },
  {
    label: 'Inventario',
    keys: ['low_stock_threshold'],
  },
  {
    label: 'Pagos',
    keys: ['usdt_policy'],
  },
]

const KEY_LABELS: Record<string, string> = {
  store_name: 'Nombre de la tienda',
  store_tagline: 'Tagline',
  store_email: 'Email de contacto',
  store_instagram: 'Instagram',
  store_whatsapp: 'WhatsApp',
  store_address: 'Dirección',
  order_number_prefix: 'Prefijo de pedido',
  reservation_expiry_hours: 'Expiración reserva (horas)',
  partial_payment_options: 'Opciones pago parcial (%)',
  free_shipping_threshold_usd: 'Envío gratis desde (USD)',
  standard_shipping_cost_usd: 'Envío estándar (USD)',
  express_shipping_cost_usd: 'Envío express (USD)',
  low_stock_threshold: 'Alerta stock bajo (unidades)',
  usdt_policy: 'Política USDT',
}

// ---------------------------------------------------------------------------
// Inline row editor
// ---------------------------------------------------------------------------

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold'

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

  function handleSave() {
    startTransition(async () => {
      const res = await updateSettingAction(setting.key, draft)
      if (res.success) {
        onSaved(setting.key, draft)
        setEditing(false)
        toast.success('Configuración guardada')
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
    <tr className="bg-surface">
      <td className="px-4 py-3 align-top w-56">
        <p className="text-sm font-medium text-text-primary">
          {KEY_LABELS[setting.key] ?? setting.key}
        </p>
        {setting.description && (
          <p className="text-xs text-text-secondary mt-0.5 leading-snug">{setting.description}</p>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        {editing ? (
          <input
            autoFocus
            className={inputCls}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
          />
        ) : (
          <span className="text-sm text-text-primary font-mono">{setting.value}</span>
        )}
      </td>
      <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
        {canEdit && (
          editing ? (
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <Button size="sm" isLoading={isPending} onClick={handleSave}>
                Guardar
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
            >
              Editar
            </button>
          )
        )}
      </td>
    </tr>
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
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s)),
    )
  }

  const settingMap = new Map(settings.map((s) => [s.key, s]))

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-wide">Configuración</h1>
        <p className="text-sm text-text-secondary mt-1">
          Parámetros generales de la tienda. Los cambios son inmediatos.
        </p>
      </div>

      {!canEdit && (
        <div className="border border-border rounded-xl px-5 py-3 mb-6 text-xs text-text-secondary bg-surface/50">
          Vista de solo lectura. Necesitas permiso{' '}
          <span className="font-semibold">settings:write</span> para editar.
        </div>
      )}

      <div className="flex flex-col gap-6">
        {GROUPS.map((group) => {
          const groupSettings = group.keys
            .map((key) => settingMap.get(key))
            .filter((s): s is AdminSetting => s !== undefined)

          if (groupSettings.length === 0) return null

          return (
            <div key={group.label} className="border border-border rounded-xl overflow-hidden">
              <div className="bg-surface border-b border-border px-4 py-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {group.label}
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {groupSettings.map((s) => (
                    <SettingRow
                      key={s.key}
                      setting={s}
                      canEdit={canEdit}
                      onSaved={handleSaved}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      {/* Unknown settings (not in groups) */}
      {(() => {
        const knownKeys = new Set(GROUPS.flatMap((g) => g.keys))
        const unknown = settings.filter((s) => !knownKeys.has(s.key))
        if (unknown.length === 0) return null
        return (
          <div className="mt-6 border border-border rounded-xl overflow-hidden">
            <div className="bg-surface border-b border-border px-4 py-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Otros
              </p>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {unknown.map((s) => (
                  <SettingRow
                    key={s.key}
                    setting={s}
                    canEdit={canEdit}
                    onSaved={handleSaved}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      })()}
    </div>
  )
}
