'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { saveCustomSection, saveCustomSectionFull } from './customSectionsActions'
import type { CustomSectionData } from '@/lib/types'

const SLOT_INFO: Record<number, { name: string; desc: string }> = {
  1: {
    name: 'Slot 1',
    desc: 'Aparece entre "Colección Mujer/Hombre" y "Colecciones Especiales"',
  },
  2: {
    name: 'Slot 2',
    desc: 'Aparece arriba de "Nuevos Ingresos"',
  },
  3: {
    name: 'Slot 3',
    desc: 'Aparece arriba de "Ofertas de la Semana"',
  },
}

interface LocalCard {
  tempId: string
  label: string
  href: string
  image_url: string
  uploading: boolean
}

// ─── Card Row ─────────────────────────────────────────────────────────────────

function CardRow({
  card,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
}: {
  card: LocalCard
  onUpdate: (updates: Partial<LocalCard>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const imgInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpdate({ uploading: true })
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?folder=savaya/custom-sections', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Error al subir')
      onUpdate({ image_url: json.url, uploading: false })
    } catch {
      onUpdate({ uploading: false })
    } finally {
      if (imgInputRef.current) imgInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 border border-gray-light rounded-lg bg-gray-bg/40">
      {/* Image preview / upload */}
      <div
        className="relative w-14 h-[72px] rounded overflow-hidden border border-gray-light shrink-0 cursor-pointer hover:border-black transition-colors"
        onClick={() => imgInputRef.current?.click()}
        title="Click para subir imagen"
      >
        {card.image_url ? (
          <Image src={card.image_url} alt={card.label || 'card'} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-bg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-text">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {card.uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Inputs */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
        <div>
          <label className="block text-[10px] font-heading font-semibold uppercase tracking-wider text-gray-text mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={card.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Para Runners"
            className="w-full h-8 border border-gray-light rounded px-2 text-xs focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-heading font-semibold uppercase tracking-wider text-gray-text mb-1">
            URL destino
          </label>
          <input
            type="text"
            value={card.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
            placeholder="/coleccion/runners"
            className="w-full h-8 border border-gray-light rounded px-2 text-xs focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* Order + delete controls */}
      <div className="flex flex-col gap-0.5 shrink-0 pt-4">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          title="Mover arriba"
          className="w-6 h-6 flex items-center justify-center text-gray-text hover:text-black disabled:opacity-25 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9V3M3 6l3-3 3 3" /></svg>
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          title="Mover abajo"
          className="w-6 h-6 flex items-center justify-center text-gray-text hover:text-black disabled:opacity-25 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3v6M3 6l3 3 3-3" /></svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Eliminar card"
          className="w-6 h-6 flex items-center justify-center text-gray-text hover:text-sale transition-colors text-lg leading-none mt-1"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ─── Slot Editor ──────────────────────────────────────────────────────────────

function SlotEditor({ section }: { section: CustomSectionData }) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(section.title ?? '')
  const [isActive, setIsActive] = useState(section.is_active)
  const [cards, setCards] = useState<LocalCard[]>(
    section.cards.map((c) => ({
      tempId: c.id,
      label: c.label,
      href: c.href,
      image_url: c.image_url ?? '',
      uploading: false,
    }))
  )
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const info = SLOT_INFO[section.slot] ?? { name: `Slot ${section.slot}`, desc: '' }

  function handleToggleActive() {
    const next = !isActive
    setIsActive(next)
    startTransition(async () => {
      await saveCustomSection(section.id, { is_active: next })
    })
  }

  function addCard() {
    setCards((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), label: '', href: '', image_url: '', uploading: false },
    ])
    setSaved(false)
  }

  function updateCard(tempId: string, updates: Partial<LocalCard>) {
    setCards((prev) => prev.map((c) => (c.tempId === tempId ? { ...c, ...updates } : c)))
    setSaved(false)
  }

  function deleteCard(tempId: string) {
    setCards((prev) => prev.filter((c) => c.tempId !== tempId))
    setSaved(false)
  }

  function moveUp(i: number) {
    if (i === 0) return
    setCards((prev) => {
      const next = [...prev]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next
    })
    setSaved(false)
  }

  function moveDown(i: number) {
    setCards((prev) => {
      if (i === prev.length - 1) return prev
      const next = [...prev]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      try {
        await saveCustomSectionFull(section.id, {
          title: title.trim() || null,
          cards: cards
            .filter((c) => c.label.trim())
            .map((c, i) => ({
              label: c.label.trim(),
              href: c.href.trim() || '#',
              image_url: c.image_url || null,
              display_order: i,
            })),
        })
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="bg-white border border-gray-light rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-light bg-gray-bg">
        <div>
          <p className="text-sm font-heading font-semibold text-black">{info.name}</p>
          <p className="text-xs text-gray-text mt-0.5">{info.desc}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-gray-text">{isActive ? 'Activo' : 'Inactivo'}</span>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isPending}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${isActive ? 'bg-black' : 'bg-gray-light'}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-1'}`}
            />
          </button>
        </label>
      </div>

      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-heading font-medium text-black mb-1">
            Título de la sección <span className="text-gray-text font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
            placeholder="Estilos de vida, Para todos los gustos…"
            className="w-full h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
          />
          <p className="text-[11px] text-gray-text mt-1">
            Si no hay título, solo se muestran las cards sin encabezado.
          </p>
        </div>

        {/* Cards list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-heading font-medium text-black">
              Cards{cards.length > 0 ? ` (${cards.length})` : ''}
            </p>
            <p className="text-[11px] text-gray-text">
              Imagen recomendada: 600 × 750 px (4:5)
            </p>
          </div>

          {cards.length === 0 ? (
            <p className="text-xs text-gray-text py-4 text-center border border-dashed border-gray-light rounded-lg">
              Sin cards. Agrega al menos una para mostrar esta sección.
            </p>
          ) : (
            <div className="space-y-2">
              {cards.map((card, i) => (
                <CardRow
                  key={card.tempId}
                  card={card}
                  onUpdate={(updates) => updateCard(card.tempId, updates)}
                  onMoveUp={() => moveUp(i)}
                  onMoveDown={() => moveDown(i)}
                  onDelete={() => deleteCard(card.tempId)}
                  isFirst={i === 0}
                  isLast={i === cards.length - 1}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addCard}
            className="mt-2 w-full h-9 border border-dashed border-gray-light rounded text-xs font-heading font-semibold text-gray-text hover:border-black hover:text-black transition-colors"
          >
            + Agregar card
          </button>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-1 border-t border-gray-light">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="h-9 px-4 bg-black text-white text-xs font-heading font-semibold rounded hover:bg-accent transition-colors disabled:opacity-40"
          >
            {isPending ? 'Guardando…' : 'Guardar sección'}
          </button>
          {saved && !isPending && (
            <span className="text-xs text-green-600 font-medium">✓ Guardado</span>
          )}
          {error && !isPending && (
            <span className="text-xs text-sale">{error}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CustomSectionsEditor({ sections }: { sections: CustomSectionData[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <SlotEditor key={section.id} section={section} />
      ))}
    </div>
  )
}
