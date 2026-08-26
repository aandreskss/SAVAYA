'use client'

import { useState, useTransition } from 'react'
import { Toggle } from '@/shared/ui/Toggle'
import { toast } from '@/shared/ui/toast-store'
import { BlockContentForm } from './BlockContentForm'
import { BlockPreview } from './BlockPreview'
import {
  reorderSectionsAction,
  toggleSectionActiveAction,
  updateSectionContentAction,
  createSectionAction,
  deleteSectionAction,
} from '../actions'
import { BLOCK_TYPE_LABELS } from '../types'
import type { AdminSection, AdminSectionType } from '../types'

const ADDABLE_BLOCK_TYPES: AdminSectionType[] = [
  'announcement_bar',
  'hero',
  'shop_by_category',
  'product_carousel',
  'editorial_block',
  'split_block',
  'benefits_block',
  'newsletter',
  'promo_banner',
  'social_proof_grid',
]

type Props = {
  initialSections: AdminSection[]
}

export function HomeSectionsEditor({ initialSections }: Props) {
  const [sections, setSections] = useState<AdminSection[]>(
    [...initialSections].sort((a, b) => a.sortOrder - b.sortOrder),
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newType, setNewType] = useState<AdminSectionType>('product_carousel')
  const [contentPending, startContentTransition] = useTransition()
  const [reorderPending, startReorderTransition] = useTransition()
  const [togglePending, startToggleTransition] = useTransition()
  const [addPending, startAddTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()

  const selectedSection = sections.find((s) => s.id === selectedId) ?? null

  // ---------------------------------------------------------------------------
  // Reorder
  // ---------------------------------------------------------------------------

  function move(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sections.length) return

    const next = [...sections]
    const tempOrder = next[idx].sortOrder
    next[idx] = { ...next[idx], sortOrder: next[targetIdx].sortOrder }
    next[targetIdx] = { ...next[targetIdx], sortOrder: tempOrder }
    next.sort((a, b) => a.sortOrder - b.sortOrder)
    setSections(next)

    startReorderTransition(async () => {
      const result = await reorderSectionsAction({
        items: next.map((s) => ({ id: s.id, sortOrder: s.sortOrder })),
      })
      if (!result.success) {
        toast.error(result.error)
        setSections([...initialSections].sort((a, b) => a.sortOrder - b.sortOrder))
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Toggle active
  // ---------------------------------------------------------------------------

  function handleToggle(sectionId: string, isActive: boolean) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, isActive } : s)),
    )
    startToggleTransition(async () => {
      const result = await toggleSectionActiveAction({ sectionId, isActive })
      if (!result.success) {
        toast.error(result.error)
        setSections((prev) =>
          prev.map((s) => (s.id === sectionId ? { ...s, isActive: !isActive } : s)),
        )
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Save content
  // ---------------------------------------------------------------------------

  function handleSaveContent(content: unknown) {
    if (!selectedSection) return
    startContentTransition(async () => {
      const result = await updateSectionContentAction({
        sectionId: selectedSection.id,
        type: selectedSection.type,
        content: content as Record<string, unknown>,
      })
      if (result.success) {
        toast.success('Bloque actualizado')
        setSections((prev) =>
          prev.map((s) =>
            s.id === selectedSection.id ? { ...s, content, updatedAt: new Date() } : s,
          ),
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Add block
  // ---------------------------------------------------------------------------

  function handleAddBlock() {
    const maxSortOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sortOrder)) : -1
    startAddTransition(async () => {
      const result = await createSectionAction({
        pageSlug: 'home',
        type: newType,
        currentMaxSortOrder: maxSortOrder,
      })
      if (result.success) {
        toast.success('Bloque agregado')
        setSections((prev) => [...prev, result.data].sort((a, b) => a.sortOrder - b.sortOrder))
        setSelectedId(result.data.id)
      } else {
        toast.error(result.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Delete block
  // ---------------------------------------------------------------------------

  function handleDelete(sectionId: string) {
    if (!confirm('¿Eliminar este bloque? Esta acción no se puede deshacer.')) return
    startDeleteTransition(async () => {
      const result = await deleteSectionAction({ sectionId })
      if (result.success) {
        toast.success('Bloque eliminado')
        setSections((prev) => prev.filter((s) => s.id !== sectionId))
        if (selectedId === sectionId) setSelectedId(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left — block list */}
      <div className="w-full lg:w-72 shrink-0 bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-medium text-sm">Bloques de la página home</h2>
        </div>

        {sections.length === 0 ? (
          <p className="px-4 py-6 text-xs text-text-secondary text-center">
            No hay bloques. Agrega uno abajo.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {sections.map((section, idx) => {
              const isSelected = section.id === selectedId
              return (
                <li
                  key={section.id}
                  className={`px-3 py-2.5 flex items-center gap-2 ${isSelected ? 'bg-surface-2' : ''}`}
                >
                  {/* Order arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => move(idx, 'up')}
                      disabled={idx === 0 || reorderPending}
                      aria-label="Subir bloque"
                      className="p-0.5 rounded text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 'down')}
                      disabled={idx === sections.length - 1 || reorderPending}
                      aria-label="Bajar bloque"
                      className="p-0.5 rounded text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Toggle */}
                  <Toggle
                    checked={section.isActive}
                    onChange={(v) => handleToggle(section.id, v)}
                    disabled={togglePending}
                    size="sm"
                  />

                  {/* Label */}
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : section.id)}
                    className={`flex-1 text-left text-xs font-medium leading-snug hover:text-text-primary ${
                      section.isActive ? 'text-text-primary' : 'text-text-secondary line-through'
                    }`}
                  >
                    {BLOCK_TYPE_LABELS[section.type]}
                  </button>

                  {/* Edit / Delete */}
                  {isSelected && (
                    <span className="text-xs text-accent-gold shrink-0">✎</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(section.id)}
                    disabled={deletePending}
                    aria-label="Eliminar bloque"
                    className="shrink-0 p-0.5 rounded text-text-muted hover:text-error transition-colors disabled:opacity-30"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ol>
        )}

        {/* Add block */}
        <div className="px-3 py-3 border-t border-border bg-surface-2 flex gap-2 items-center">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as AdminSectionType)}
            className="flex-1 text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/30"
          >
            {ADDABLE_BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>{BLOCK_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddBlock}
            disabled={addPending}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-gold text-brand-black hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {addPending ? '...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {/* Right — content editor */}
      <div className="flex-1 min-w-0 bg-surface border border-border rounded-xl overflow-hidden">
        {selectedSection ? (
          <>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">
                Editando: {BLOCK_TYPE_LABELS[selectedSection.type]}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Última actualización:{' '}
                {new Date(selectedSection.updatedAt).toLocaleString('es-VE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <BlockPreview section={selectedSection} />
            <div className="p-5">
              <BlockContentForm
                key={selectedSection.id}
                section={selectedSection}
                onSave={handleSaveContent}
                isPending={contentPending}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-sm text-text-secondary">
            Selecciona un bloque para editar su contenido
          </div>
        )}
      </div>
    </div>
  )
}
