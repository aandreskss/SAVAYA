'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Toggle } from '@/shared/ui/Toggle'
import { UrlPicker } from '@/shared/ui/UrlPicker'
import { toast } from '@/shared/ui'
import {
  createNavItemAction,
  updateNavItemAction,
  deleteNavItemAction,
  reorderNavItemsAction,
  toggleNavItemAction,
} from '../actions'
import type { AdminNavItem } from '../types'

type Props = {
  initialItems: AdminNavItem[]
}

const GENDER_LABELS: Record<string, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
}

type FormState = {
  label: string
  type: 'link' | 'category_group'
  href: string
  gender: 'mujer' | 'hombre' | ''
  sortOrder: string
  isActive: boolean
}

const DEFAULT_FORM: FormState = {
  label: '',
  type: 'link',
  href: '',
  gender: '',
  sortOrder: '0',
  isActive: true,
}

export function NavbarEditor({ initialItems }: Props) {
  const [items, setItems] = useState<AdminNavItem[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingId(null)
    setForm({ ...DEFAULT_FORM, sortOrder: String(items.length + 1) })
    setShowForm(true)
  }

  function openEdit(item: AdminNavItem) {
    setEditingId(item.id)
    setForm({
      label: item.label,
      type: item.type,
      href: item.href ?? '',
      gender: item.gender ?? '',
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        label: form.label,
        type: form.type,
        href: form.type === 'link' ? (form.href || null) : (form.href || null),
        gender: form.type === 'category_group' && form.gender
          ? (form.gender as 'mujer' | 'hombre')
          : null,
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: form.isActive,
      }

      if (editingId) {
        const result = await updateNavItemAction(editingId, payload)
        if (!result.success) { toast.error(result.error); return }
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingId
              ? { ...it, ...payload, gender: payload.gender ?? null }
              : it,
          ),
        )
        toast.success('Ítem actualizado')
      } else {
        const result = await createNavItemAction(payload)
        if (!result.success) { toast.error(result.error); return }
        setItems((prev) => [...prev, result.data])
        toast.success('Ítem creado')
      }

      cancelForm()
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const next = !current
      const result = await toggleNavItemAction(id, next)
      if (!result.success) { toast.error(result.error); return }
      setItems((prev) => prev.map((it) => it.id === id ? { ...it, isActive: next } : it))
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNavItemAction(id)
      if (!result.success) { toast.error(result.error); return }
      setItems((prev) => prev.filter((it) => it.id !== id))
      if (editingId === id) cancelForm()
      toast.success('Ítem eliminado')
    })
  }

  function handleMoveUp(idx: number) {
    if (idx === 0) return
    const next = [...items]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    const reordered = next.map((it, i) => ({ ...it, sortOrder: i + 1 }))
    setItems(reordered)
    startTransition(async () => {
      const result = await reorderNavItemsAction(
        reordered.map((it) => ({ id: it.id, sortOrder: it.sortOrder })),
      )
      if (!result.success) toast.error(result.error)
    })
  }

  function handleMoveDown(idx: number) {
    if (idx === items.length - 1) return
    const next = [...items]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    const reordered = next.map((it, i) => ({ ...it, sortOrder: i + 1 }))
    setItems(reordered)
    startTransition(async () => {
      const result = await reorderNavItemsAction(
        reordered.map((it) => ({ id: it.id, sortOrder: it.sortOrder })),
      )
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">
            Controla qué ítems aparecen en el navbar y en qué orden. Los ítems tipo
            &ldquo;Grupo de categorías&rdquo; muestran un dropdown con las categorías del género elegido.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={openCreate}>
            + Nuevo ítem
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-display text-sm uppercase tracking-widest text-text-secondary">
            {editingId ? 'Editar ítem' : 'Nuevo ítem'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Etiqueta"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              isRequired
              hint="Texto que aparece en el navbar"
            />
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'link' | 'category_group', gender: '', href: '' }))}
            >
              <option value="link">Enlace directo</option>
              <option value="category_group">Grupo de categorías (dropdown)</option>
            </Select>
          </div>

          {form.type === 'link' && (
            <div className="space-y-1">
              <label className="font-sans text-sm font-medium text-text-primary">URL destino</label>
              <UrlPicker
                value={form.href}
                onChange={(url) => setForm((f) => ({ ...f, href: url }))}
                placeholder="/nuevos, /ofertas, /coleccion/verano..."
              />
            </div>
          )}

          {form.type === 'category_group' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Género del grupo"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as 'mujer' | 'hombre' | '' }))}
              >
                <option value="">Seleccionar...</option>
                <option value="mujer">Mujer</option>
                <option value="hombre">Hombre</option>
              </Select>
              <div className="space-y-1">
                <label className="font-sans text-sm font-medium text-text-primary">URL del encabezado</label>
                <UrlPicker
                  value={form.href}
                  onChange={(url) => setForm((f) => ({ ...f, href: url }))}
                  placeholder="/mujer o /hombre..."
                />
                <p className="text-xs text-text-muted">Para el clic en el label del menú</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 items-end">
            <Input
              label="Orden"
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
            <Toggle
              label="Activo"
              checked={form.isActive}
              onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} isLoading={isPending}>
              {editingId ? 'Guardar cambios' : 'Crear ítem'}
            </Button>
            <Button size="sm" variant="secondary" onClick={cancelForm}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-muted border border-dashed border-border rounded-xl">
          No hay ítems de navegación. Crea el primero.
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 bg-surface transition-colors ${!item.isActive ? 'opacity-50' : ''}`}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0 || isPending}
                  className="p-0.5 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                  title="Mover arriba"
                >
                  &#9650;
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === items.length - 1 || isPending}
                  className="p-0.5 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                  title="Mover abajo"
                >
                  &#9660;
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-text-primary truncate">
                  {item.label}
                </p>
                <p className="font-sans text-xs text-text-muted truncate">
                  {item.type === 'category_group'
                    ? `Grupo: ${GENDER_LABELS[item.gender ?? ''] ?? '—'}`
                    : `Enlace: ${item.href ?? '—'}`}
                </p>
              </div>

              {/* Active toggle */}
              <button
                type="button"
                onClick={() => handleToggle(item.id, item.isActive)}
                disabled={isPending}
                className={`text-xs font-sans px-2 py-0.5 rounded-full border transition-colors ${
                  item.isActive
                    ? 'border-accent-gold/40 text-accent-gold bg-accent-gold/8'
                    : 'border-border text-text-muted bg-surface-2'
                }`}
              >
                {item.isActive ? 'Activo' : 'Inactivo'}
              </button>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="px-2.5 py-1 text-xs font-sans rounded border border-border bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="px-2.5 py-1 text-xs font-sans rounded border border-border bg-surface-2 text-text-secondary hover:text-error transition-colors"
                >
                  &#10005;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted">
        Los grupos de categorías muestran automáticamente las categorías etiquetadas con ese género (o &ldquo;unisex&rdquo;).
        Administra las categorías en <strong>Productos &rsaquo; Categorías</strong>.
      </p>
    </div>
  )
}
