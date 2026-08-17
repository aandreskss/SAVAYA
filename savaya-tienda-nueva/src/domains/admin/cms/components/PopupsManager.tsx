'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { toast } from '@/shared/ui/toast-store'
import { createPopupAction, updatePopupAction, deletePopupAction } from '../actions'
import type { AdminPopup } from '../types'

type Props = {
  initialPopups: AdminPopup[]
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; popup: AdminPopup }
  | { mode: 'delete'; popup: AdminPopup }

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-accent-gold/20'

const textareaClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-accent-gold/20 resize-y'

function toDatetimeLocal(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ---------------------------------------------------------------------------
// Popup form
// ---------------------------------------------------------------------------

type FormData = {
  title: string
  imageUrl: string
  ctaText: string
  ctaUrl: string
  delaySeconds: number
  showOnPagesRaw: string
  maxShowsPerSession: number
  isActive: boolean
  startsAt: string
  endsAt: string
}

type PopupFormProps = {
  initial?: AdminPopup
  onSubmit: (data: FormData) => void
  isPending: boolean
  onCancel: () => void
}

function PopupForm({ initial, onSubmit, isPending, onCancel }: PopupFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [ctaText, setCtaText] = useState(initial?.ctaText ?? '')
  const [ctaUrl, setCtaUrl] = useState(initial?.ctaUrl ?? '')
  const [delaySeconds, setDelaySeconds] = useState(String(initial?.delaySeconds ?? 5))
  const [showOnPagesRaw, setShowOnPagesRaw] = useState(
    initial?.showOnPages?.join('\n') ?? '',
  )
  const [maxShowsPerSession, setMaxShowsPerSession] = useState(
    String(initial?.maxShowsPerSession ?? 1),
  )
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initial?.startsAt ?? null))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initial?.endsAt ?? null))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      title,
      imageUrl,
      ctaText,
      ctaUrl,
      delaySeconds: parseInt(delaySeconds) || 5,
      showOnPagesRaw,
      maxShowsPerSession: parseInt(maxShowsPerSession) || 1,
      isActive,
      startsAt,
      endsAt,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Título interno
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          URL de imagen
        </label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Texto del CTA (opcional)
          </label>
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            maxLength={80}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            URL del CTA (opcional)
          </label>
          <input
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Delay antes de mostrar (segundos)
          </label>
          <input
            type="number"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(e.target.value)}
            min={0}
            max={120}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Máximo de veces por sesión
          </label>
          <input
            type="number"
            value={maxShowsPerSession}
            onChange={(e) => setMaxShowsPerSession(e.target.value)}
            min={1}
            max={10}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Páginas donde mostrar (una por línea, vacío = todas)
        </label>
        <textarea
          value={showOnPagesRaw}
          onChange={(e) => setShowOnPagesRaw(e.target.value)}
          rows={3}
          placeholder={'/\n/coleccion\n/producto/sandalia-verano'}
          className={textareaClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Inicio programado (opcional)
          </label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Fin programado (opcional)
          </label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="pt-1">
        <Toggle label="Popup activo" checked={isActive} onChange={setIsActive} size="sm" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" isLoading={isPending}>
          {initial ? 'Guardar cambios' : 'Crear popup'}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PopupsManager({ initialPopups }: Props) {
  const [popups, setPopups] = useState<AdminPopup[]>(initialPopups)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [isPending, startTransition] = useTransition()

  function handleCreate(data: FormData) {
    startTransition(async () => {
      const result = await createPopupAction(data)
      if (result.success) {
        setPopups((prev) => [result.data, ...prev])
        setModal({ mode: 'closed' })
        toast.success('Popup creado')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUpdate(popupId: string, data: FormData) {
    startTransition(async () => {
      const result = await updatePopupAction(popupId, data)
      if (result.success) {
        const showOnPages =
          data.showOnPagesRaw.trim()
            ? data.showOnPagesRaw.split('\n').map((s) => s.trim()).filter(Boolean)
            : null
        setPopups((prev) =>
          prev.map((p) =>
            p.id === popupId
              ? {
                  ...p,
                  title: data.title,
                  imageUrl: data.imageUrl,
                  ctaText: data.ctaText || null,
                  ctaUrl: data.ctaUrl || null,
                  delaySeconds: data.delaySeconds,
                  showOnPages,
                  maxShowsPerSession: data.maxShowsPerSession,
                  isActive: data.isActive,
                  startsAt: data.startsAt ? new Date(data.startsAt) : null,
                  endsAt: data.endsAt ? new Date(data.endsAt) : null,
                }
              : p,
          ),
        )
        setModal({ mode: 'closed' })
        toast.success('Popup actualizado')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(popupId: string) {
    startTransition(async () => {
      const result = await deletePopupAction(popupId)
      if (result.success) {
        setPopups((prev) => prev.filter((p) => p.id !== popupId))
        setModal({ mode: 'closed' })
        toast.success('Popup eliminado')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {popups.length} popup{popups.length !== 1 ? 's' : ''} configurado
          {popups.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setModal({ mode: 'create' })}>
          + Nuevo popup
        </Button>
      </div>

      {popups.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm text-text-secondary">
          No hay popups. Crea el primero.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Título
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide hidden md:table-cell">
                  Delay
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide hidden md:table-cell">
                  Páginas
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {popups.map((popup) => (
                <tr key={popup.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{popup.title}</td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                    {popup.delaySeconds}s
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                    {popup.showOnPages?.length
                      ? `${popup.showOnPages.length} página${popup.showOnPages.length !== 1 ? 's' : ''}`
                      : 'Todas'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${
                        popup.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-border text-text-secondary'
                      }`}
                    >
                      {popup.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'edit', popup })}
                        className="text-xs text-text-secondary hover:text-text-primary underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'delete', popup })}
                        className="text-xs text-error hover:underline"
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
      )}

      {/* Create modal */}
      <Modal
        isOpen={modal.mode === 'create'}
        onClose={() => setModal({ mode: 'closed' })}
        title="Nuevo popup"
        size="lg"
      >
        <PopupForm
          onSubmit={handleCreate}
          isPending={isPending}
          onCancel={() => setModal({ mode: 'closed' })}
        />
      </Modal>

      {/* Edit modal */}
      {modal.mode === 'edit' && (
        <Modal
          isOpen
          onClose={() => setModal({ mode: 'closed' })}
          title="Editar popup"
          size="lg"
        >
          <PopupForm
            initial={modal.popup}
            onSubmit={(data) => handleUpdate(modal.popup.id, data)}
            isPending={isPending}
            onCancel={() => setModal({ mode: 'closed' })}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {modal.mode === 'delete' && (
        <Modal
          isOpen
          onClose={() => setModal({ mode: 'closed' })}
          title="Eliminar popup"
          size="sm"
        >
          <p className="text-sm text-text-secondary mb-5">
            ¿Eliminar <strong>{modal.popup.title}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModal({ mode: 'closed' })}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isPending}
              onClick={() => handleDelete(modal.popup.id)}
            >
              Eliminar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
