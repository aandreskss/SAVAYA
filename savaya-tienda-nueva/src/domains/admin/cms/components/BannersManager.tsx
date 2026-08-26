'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { toast } from '@/shared/ui/toast-store'
import { ImageUploader } from './ImageUploader'
import { createBannerAction, updateBannerAction, deleteBannerAction } from '../actions'
import type { AdminBanner } from '../types'

type Props = {
  initialBanners: AdminBanner[]
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; banner: AdminBanner }
  | { mode: 'delete'; banner: AdminBanner }

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-accent-gold/20'

function toDatetimeLocal(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Banner form (reused for create + edit)
// ---------------------------------------------------------------------------

type BannerFormProps = {
  initial?: AdminBanner
  onSubmit: (data: {
    title: string
    imageDesktopUrl: string
    imageMobileUrl: string
    ctaText: string
    ctaUrl: string
    isActive: boolean
    startsAt: string
    endsAt: string
    sortOrder: number
  }) => void
  isPending: boolean
  onCancel: () => void
}

function BannerForm({ initial, onSubmit, isPending, onCancel }: BannerFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [imageDesktopUrl, setImageDesktopUrl] = useState(initial?.imageDesktopUrl ?? '')
  const [imageMobileUrl, setImageMobileUrl] = useState(initial?.imageMobileUrl ?? '')
  const [ctaText, setCtaText] = useState(initial?.ctaText ?? '')
  const [ctaUrl, setCtaUrl] = useState(initial?.ctaUrl ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initial?.startsAt ?? null))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initial?.endsAt ?? null))
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      title,
      imageDesktopUrl,
      imageMobileUrl,
      ctaText,
      ctaUrl,
      isActive,
      startsAt,
      endsAt,
      sortOrder: parseInt(sortOrder) || 0,
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

      <ImageUploader
        label="Imagen desktop"
        hint="1920 × 700 px · horizontal"
        value={imageDesktopUrl}
        onChange={setImageDesktopUrl}
        required
      />

      <ImageUploader
        label="Imagen mobile"
        hint="750 × 1000 px · vertical"
        value={imageMobileUrl}
        onChange={setImageMobileUrl}
        required
      />

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

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Orden (número, menor primero)
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
            className={inputClass}
          />
        </div>
        <div className="pt-5">
          <Toggle label="Activo" checked={isActive} onChange={setIsActive} size="sm" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" isLoading={isPending}>
          {initial ? 'Guardar cambios' : 'Crear banner'}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BannersManager({ initialBanners }: Props) {
  const [banners, setBanners] = useState<AdminBanner[]>(initialBanners)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [isPending, startTransition] = useTransition()

  function handleCreate(data: Parameters<BannerFormProps['onSubmit']>[0]) {
    startTransition(async () => {
      const result = await createBannerAction(data)
      if (result.success) {
        setBanners((prev) =>
          [...prev, result.data].sort((a, b) => a.sortOrder - b.sortOrder),
        )
        setModal({ mode: 'closed' })
        toast.success('Banner creado')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUpdate(bannerId: string, data: Parameters<BannerFormProps['onSubmit']>[0]) {
    startTransition(async () => {
      const result = await updateBannerAction(bannerId, data)
      if (result.success) {
        setBanners((prev) =>
          prev
            .map((b) =>
              b.id === bannerId
                ? {
                    ...b,
                    ...data,
                    ctaText: data.ctaText || null,
                    ctaUrl: data.ctaUrl || null,
                    startsAt: data.startsAt ? new Date(data.startsAt) : null,
                    endsAt: data.endsAt ? new Date(data.endsAt) : null,
                  }
                : b,
            )
            .sort((a, b) => a.sortOrder - b.sortOrder),
        )
        setModal({ mode: 'closed' })
        toast.success('Banner actualizado')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(bannerId: string) {
    startTransition(async () => {
      const result = await deleteBannerAction(bannerId)
      if (result.success) {
        setBanners((prev) => prev.filter((b) => b.id !== bannerId))
        setModal({ mode: 'closed' })
        toast.success('Banner eliminado')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {banners.length} banner{banners.length !== 1 ? 's' : ''} configurado
          {banners.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setModal({ mode: 'create' })}>
          + Nuevo banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm text-text-secondary">
          No hay banners. Crea el primero.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Orden
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Título
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide hidden md:table-cell">
                  Desde
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide hidden md:table-cell">
                  Hasta
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3 text-text-secondary">{banner.sortOrder}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{banner.title}</td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                    {formatDate(banner.startsAt)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                    {formatDate(banner.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${
                        banner.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-border text-text-secondary'
                      }`}
                    >
                      {banner.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'edit', banner })}
                        className="text-xs text-text-secondary hover:text-text-primary underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'delete', banner })}
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
        title="Nuevo banner"
        size="lg"
      >
        <BannerForm
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
          title="Editar banner"
          size="lg"
        >
          <BannerForm
            initial={modal.banner}
            onSubmit={(data) => handleUpdate(modal.banner.id, data)}
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
          title="Eliminar banner"
          size="sm"
        >
          <p className="text-sm text-text-secondary mb-5">
            ¿Eliminar <strong>{modal.banner.title}</strong>? Esta acción no se puede deshacer.
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
              onClick={() => handleDelete(modal.banner.id)}
            >
              Eliminar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
