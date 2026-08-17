'use client'

import { useState, useTransition } from 'react'
import { Toggle } from '@/shared/ui/Toggle'
import { toast } from '@/shared/ui/toast-store'
import { BlockContentForm } from './BlockContentForm'
import {
  reorderSectionsAction,
  toggleSectionActiveAction,
  updateSectionContentAction,
} from '../actions'
import { BLOCK_TYPE_LABELS } from '../types'
import type { AdminSection } from '../types'

type Props = {
  initialSections: AdminSection[]
}

export function HomeSectionsEditor({ initialSections }: Props) {
  const [sections, setSections] = useState<AdminSection[]>(
    [...initialSections].sort((a, b) => a.sortOrder - b.sortOrder),
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contentPending, startContentTransition] = useTransition()
  const [reorderPending, startReorderTransition] = useTransition()
  const [togglePending, startToggleTransition] = useTransition()

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
  // Render
  // ---------------------------------------------------------------------------

  if (sections.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm text-text-secondary">
        No se encontraron secciones para la página home. Ejecuta el seed para cargar datos.
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left — block list */}
      <div className="w-full lg:w-72 shrink-0 bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-medium text-sm">Bloques de la página home</h2>
        </div>
        <ol className="divide-y divide-border">
          {sections.map((section, idx) => {
            const isSelected = section.id === selectedId
            return (
              <li
                key={section.id}
                className={`px-4 py-3 flex items-center gap-3 ${isSelected ? 'bg-surface-2' : ''}`}
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
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
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
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
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

                {/* Edit indicator */}
                {isSelected && (
                  <span className="text-xs text-accent-gold shrink-0">✎</span>
                )}
              </li>
            )
          })}
        </ol>
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
