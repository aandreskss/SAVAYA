'use client'

import { useState, useTransition } from 'react'
import { Button, Modal, Badge, Toggle } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import {
  createDiscountAction,
  updateDiscountAction,
  deleteDiscountAction,
} from '../actions'
import type { AdminDiscount } from '../types'
import type { DiscountFormPayload } from '../validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  percentage: '%',
  fixed_usd: 'USD fijo',
}

const APPLIES_LABELS: Record<string, string> = {
  all: 'Todos',
  category: 'Categoría',
  product: 'Producto',
  collection: 'Colección',
  customer: 'Cliente',
}

function toDatetimeLocal(d: Date | null | undefined): string {
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatValue(discount: AdminDiscount): string {
  return discount.type === 'percentage'
    ? `${discount.value}%`
    : `$${discount.value.toFixed(2)}`
}

function usageLabel(discount: AdminDiscount): string {
  if (!discount.maxUsesTotal) return `${discount.usedCount} / ∞`
  return `${discount.usedCount} / ${discount.maxUsesTotal}`
}

// ---------------------------------------------------------------------------
// Modal state
// ---------------------------------------------------------------------------

type ModalState =
  | 'closed'
  | 'create'
  | { mode: 'edit'; discount: AdminDiscount }
  | { mode: 'delete'; discount: AdminDiscount }

// ---------------------------------------------------------------------------
// Discount form (shared for create + edit)
// ---------------------------------------------------------------------------

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold placeholder:text-text-secondary/50'
const labelCls = 'block text-xs font-medium text-text-secondary mb-1'
const selectCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold'

type FormState = {
  code: string
  type: 'percentage' | 'fixed_usd'
  value: string
  minOrderUsd: string
  maxUsesTotal: string
  maxUsesPerCustomer: string
  appliesToType: 'all' | 'category' | 'product' | 'collection' | 'customer'
  appliesToId: string
  isFirstOrderOnly: boolean
  isActive: boolean
  startsAt: string
  endsAt: string
}

function defaultForm(discount?: AdminDiscount): FormState {
  return {
    code: discount?.code ?? '',
    type: discount?.type ?? 'percentage',
    value: discount ? String(discount.value) : '',
    minOrderUsd: discount?.minOrderUsd != null ? String(discount.minOrderUsd) : '',
    maxUsesTotal: discount?.maxUsesTotal != null ? String(discount.maxUsesTotal) : '',
    maxUsesPerCustomer: String(discount?.maxUsesPerCustomer ?? 1),
    appliesToType: discount?.appliesToType ?? 'all',
    appliesToId: discount?.appliesToId ?? '',
    isFirstOrderOnly: discount?.isFirstOrderOnly ?? false,
    isActive: discount?.isActive ?? true,
    startsAt: toDatetimeLocal(discount?.startsAt),
    endsAt: toDatetimeLocal(discount?.endsAt),
  }
}

function formToPayload(f: FormState): DiscountFormPayload {
  return {
    code: f.code.toUpperCase().trim(),
    type: f.type,
    value: Number(f.value),
    minOrderUsd: f.minOrderUsd ? Number(f.minOrderUsd) : null,
    maxUsesTotal: f.maxUsesTotal ? Number(f.maxUsesTotal) : null,
    maxUsesPerCustomer: Number(f.maxUsesPerCustomer) || 1,
    appliesToType: f.appliesToType,
    appliesToId: f.appliesToId.trim() || null,
    isFirstOrderOnly: f.isFirstOrderOnly,
    isActive: f.isActive,
    startsAt: f.startsAt || null,
    endsAt: f.endsAt || null,
  }
}

function DiscountForm({
  initial,
  onSubmit,
  isPending,
}: {
  initial?: AdminDiscount
  onSubmit: (payload: DiscountFormPayload) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<FormState>(defaultForm(initial))
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(formToPayload(form))
      }}
      className="flex flex-col gap-4"
    >
      {/* Code + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Código *</label>
          <input
            required
            className={inputCls}
            placeholder="SAVAYA10"
            value={form.code}
            onChange={set('code')}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <div>
          <label className={labelCls}>Tipo *</label>
          <select className={selectCls} value={form.type} onChange={set('type')}>
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed_usd">Monto fijo (USD)</option>
          </select>
        </div>
      </div>

      {/* Value + min order */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Valor * {form.type === 'percentage' ? '(%)' : '(USD)'}
          </label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className={inputCls}
            placeholder={form.type === 'percentage' ? '10' : '5.00'}
            value={form.value}
            onChange={set('value')}
          />
        </div>
        <div>
          <label className={labelCls}>Monto mínimo (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            placeholder="Opcional"
            value={form.minOrderUsd}
            onChange={set('minOrderUsd')}
          />
        </div>
      </div>

      {/* Uses */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Usos totales máx.</label>
          <input
            type="number"
            min="1"
            step="1"
            className={inputCls}
            placeholder="Sin límite"
            value={form.maxUsesTotal}
            onChange={set('maxUsesTotal')}
          />
        </div>
        <div>
          <label className={labelCls}>Usos por cliente *</label>
          <input
            required
            type="number"
            min="1"
            step="1"
            className={inputCls}
            value={form.maxUsesPerCustomer}
            onChange={set('maxUsesPerCustomer')}
          />
        </div>
      </div>

      {/* Applies to */}
      <div>
        <label className={labelCls}>Aplica a</label>
        <select
          className={selectCls}
          value={form.appliesToType}
          onChange={set('appliesToType')}
        >
          <option value="all">Todos los productos</option>
          <option value="category">Categoría específica</option>
          <option value="product">Producto específico</option>
          <option value="collection">Colección específica</option>
          <option value="customer">Cliente específico</option>
        </select>
      </div>

      {form.appliesToType !== 'all' && (
        <div>
          <label className={labelCls}>ID de referencia (UUID)</label>
          <input
            className={inputCls}
            placeholder="UUID del recurso"
            value={form.appliesToId}
            onChange={set('appliesToId')}
          />
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Válido desde</label>
          <input
            type="datetime-local"
            className={inputCls}
            value={form.startsAt}
            onChange={set('startsAt')}
          />
        </div>
        <div>
          <label className={labelCls}>Válido hasta</label>
          <input
            type="datetime-local"
            className={inputCls}
            value={form.endsAt}
            onChange={set('endsAt')}
          />
        </div>
      </div>

      {/* Flags */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isFirstOrderOnly}
            onChange={(e) => setForm((f) => ({ ...f, isFirstOrderOnly: e.target.checked }))}
            className="w-4 h-4 accent-[var(--color-accent-gold)]"
          />
          Solo primer pedido
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 accent-[var(--color-accent-gold)]"
          />
          Activo
        </label>
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">
        {initial ? 'Guardar cambios' : 'Crear descuento'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// DiscountsManager
// ---------------------------------------------------------------------------

type Props = { initialDiscounts: AdminDiscount[] }

export function DiscountsManager({ initialDiscounts }: Props) {
  const [discounts, setDiscounts] = useState(initialDiscounts)
  const [modal, setModal] = useState<ModalState>('closed')
  const [isPending, startTransition] = useTransition()

  function handleCreate(payload: DiscountFormPayload) {
    startTransition(async () => {
      const res = await createDiscountAction(payload)
      if (res.success) {
        setDiscounts((prev) => [res.data, ...prev])
        setModal('closed')
        toast.success('Descuento creado')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleEdit(id: string, payload: DiscountFormPayload) {
    startTransition(async () => {
      const res = await updateDiscountAction(id, payload)
      if (res.success) {
        setDiscounts((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  code: payload.code.toUpperCase(),
                  type: payload.type,
                  value: payload.value,
                  minOrderUsd: payload.minOrderUsd ?? null,
                  maxUsesTotal: payload.maxUsesTotal ?? null,
                  maxUsesPerCustomer: payload.maxUsesPerCustomer,
                  appliesToType: payload.appliesToType,
                  appliesToId: payload.appliesToId ?? null,
                  isFirstOrderOnly: payload.isFirstOrderOnly,
                  isActive: payload.isActive,
                }
              : d,
          ),
        )
        setModal('closed')
        toast.success('Descuento actualizado')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteDiscountAction(id)
      if (res.success) {
        setDiscounts((prev) => prev.filter((d) => d.id !== id))
        setModal('closed')
        toast.success('Descuento eliminado')
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Promociones</h1>
          <p className="text-sm text-text-secondary mt-1">
            {discounts.length} {discounts.length === 1 ? 'código' : 'códigos'} registrados
          </p>
        </div>
        <Button onClick={() => setModal('create')}>Nuevo código</Button>
      </div>

      {/* Table */}
      {discounts.length === 0 ? (
        <div className="border border-border rounded-xl p-10 text-center text-text-secondary text-sm">
          No hay códigos de descuento. Crea el primero.
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Tipo / Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Aplica a</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Usos</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Vigencia</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {discounts.map((d) => (
                  <tr key={d.id} className="bg-surface hover:bg-surface/80">
                    <td className="px-4 py-3 font-mono font-semibold tracking-wider text-text-primary">
                      {d.code}
                      {d.isFirstOrderOnly && (
                        <span className="ml-2 text-xs text-text-secondary">(1er pedido)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      <span className="text-xs text-text-secondary">{TYPE_LABELS[d.type]} </span>
                      {formatValue(d)}
                      {d.minOrderUsd != null && (
                        <div className="text-xs text-text-secondary">Min. ${d.minOrderUsd}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{APPLIES_LABELS[d.appliesToType]}</td>
                    <td className="px-4 py-3 tabular-nums text-text-secondary">{usageLabel(d)}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {d.startsAt ? (
                        <div>Desde {new Date(d.startsAt).toLocaleDateString('es-VE')}</div>
                      ) : null}
                      {d.endsAt ? (
                        <div>Hasta {new Date(d.endsAt).toLocaleDateString('es-VE')}</div>
                      ) : d.startsAt ? null : (
                        <span className="text-text-secondary/50">Sin límite</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={d.isActive ? 'success' : 'default'} size="sm">
                        {d.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ mode: 'edit', discount: d })}
                          className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-surface-2"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setModal({ mode: 'delete', discount: d })}
                          className="text-xs text-error hover:text-error/80 transition-colors px-2 py-1 rounded hover:bg-error/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={modal === 'create'}
        onClose={() => setModal('closed')}
        title="Nuevo código de descuento"
        size="lg"
      >
        <DiscountForm onSubmit={handleCreate} isPending={isPending} />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={typeof modal === 'object' && modal.mode === 'edit'}
        onClose={() => setModal('closed')}
        title="Editar descuento"
        size="lg"
      >
        {typeof modal === 'object' && modal.mode === 'edit' && (
          <DiscountForm
            initial={modal.discount}
            onSubmit={(payload) => handleEdit(modal.discount.id, payload)}
            isPending={isPending}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={typeof modal === 'object' && modal.mode === 'delete'}
        onClose={() => setModal('closed')}
        title="Eliminar descuento"
      >
        {typeof modal === 'object' && modal.mode === 'delete' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              ¿Eliminar el código{' '}
              <span className="font-mono font-bold text-text-primary">
                {modal.discount.code}
              </span>
              ? Esta acción es permanente.
            </p>
            {modal.discount.usedCount > 0 && (
              <p className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
                Este código ha sido usado {modal.discount.usedCount} veces. El historial de órdenes no se verá afectado.
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setModal('closed')}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isLoading={isPending}
                onClick={() => handleDelete(modal.discount.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
