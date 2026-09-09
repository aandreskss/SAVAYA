'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { toast } from '@/shared/ui/toast-store'
import { HomeSectionsEditor } from './HomeSectionsEditor'
import {
  createCustomPageAction,
  updateCustomPageMetaAction,
  deleteCustomPageAction,
  getPageSectionsAction,
} from '../actions'
import type { AdminPage, AdminSection } from '../types'

type Props = {
  initialPages: AdminPage[]
}

export function PagesManager({ initialPages }: Props) {
  const [pages, setPages] = useState<AdminPage[]>(initialPages)
  const [selectedPage, setSelectedPage] = useState<AdminPage | null>(null)
  const [pageSections, setPageSections] = useState<AdminSection[] | null>(null)
  const [loadingSections, setLoadingSections] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createSlug, setCreateSlug] = useState('')
  const [createTitle, setCreateTitle] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [isPending, startTransition] = useTransition()

  // ---------------------------------------------------------------------------
  // Select page → load its sections
  // ---------------------------------------------------------------------------

  async function handleSelectPage(page: AdminPage) {
    if (selectedPage?.id === page.id) return
    setSelectedPage(page)
    setEditTitle(page.title)
    setEditActive(page.isActive)
    setPageSections(null)
    setLoadingSections(true)

    const result = await getPageSectionsAction(`p/${page.slug}`)
    if (result.success) {
      setPageSections(result.data)
    } else {
      toast.error(result.error)
      setPageSections([])
    }
    setLoadingSections(false)
  }

  function handleBack() {
    setSelectedPage(null)
    setPageSections(null)
  }

  // ---------------------------------------------------------------------------
  // Create page
  // ---------------------------------------------------------------------------

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createCustomPageAction({ slug: createSlug, title: createTitle })
      if (!result.success) { toast.error(result.error); return }
      setPages((prev) => [...prev, result.data])
      setCreateSlug('')
      setCreateTitle('')
      setShowCreateForm(false)
      toast.success('Página creada')
      handleSelectPage(result.data)
    })
  }

  // ---------------------------------------------------------------------------
  // Update page meta (title + isActive)
  // ---------------------------------------------------------------------------

  function handleSaveMeta() {
    if (!selectedPage) return
    startTransition(async () => {
      const result = await updateCustomPageMetaAction(selectedPage.id, {
        title: editTitle,
        isActive: editActive,
      })
      if (!result.success) { toast.error(result.error); return }
      setPages((prev) =>
        prev.map((p) =>
          p.id === selectedPage.id ? { ...p, title: editTitle, isActive: editActive } : p,
        ),
      )
      setSelectedPage((p) => p ? { ...p, title: editTitle, isActive: editActive } : p)
      toast.success('Cambios guardados')
    })
  }

  // ---------------------------------------------------------------------------
  // Delete page
  // ---------------------------------------------------------------------------

  function handleDelete(page: AdminPage) {
    if (!confirm(`¿Eliminar la página "/${page.slug}"? Se borrarán todos sus bloques.`)) return
    startTransition(async () => {
      const result = await deleteCustomPageAction(page.id)
      if (!result.success) { toast.error(result.error); return }
      setPages((prev) => prev.filter((p) => p.id !== page.id))
      if (selectedPage?.id === page.id) handleBack()
      toast.success('Página eliminada')
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (selectedPage) {
    return (
      <div className="space-y-6">
        {/* Back + meta */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            &#8592; Volver a páginas
          </button>
          <span className="text-text-muted">|</span>
          <span className="font-mono text-xs text-text-muted">/p/{selectedPage.slug}</span>
          <a
            href={`/p/${selectedPage.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-gold hover:underline ml-auto"
          >
            Ver página &#8599;
          </a>
        </div>

        {/* Page meta editor */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-widest">Configuración de la página</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48 space-y-1">
              <label className="text-xs text-text-secondary">Título</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={100}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Estado</label>
              <Toggle
                label={editActive ? 'Activa' : 'Inactiva'}
                checked={editActive}
                onChange={setEditActive}
              />
            </div>
            <Button size="sm" onClick={handleSaveMeta} isLoading={isPending}>
              Guardar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDelete(selectedPage)}
              isLoading={isPending}
            >
              Eliminar página
            </Button>
          </div>
        </div>

        {/* Sections editor */}
        {loadingSections ? (
          <div className="h-48 flex items-center justify-center text-sm text-text-secondary">
            Cargando bloques...
          </div>
        ) : (
          <HomeSectionsEditor
            key={selectedPage.id}
            initialSections={pageSections ?? []}
            pageSlug={`p/${selectedPage.slug}`}
            pageLabel={selectedPage.title}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Crea páginas personalizadas en <span className="font-mono">/p/slug</span> con cualquier combinación de bloques CMS.
        </p>
        {!showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            + Nueva página
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="bg-surface border border-border rounded-xl p-5 space-y-4"
        >
          <h3 className="font-display text-sm uppercase tracking-widest text-text-secondary">
            Nueva página personalizada
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">
                Título de la página
              </label>
              <input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Ej: Ofertas de verano"
                maxLength={100}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">
                Slug (URL)
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted font-mono shrink-0">/p/</span>
                <input
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="ofertas-verano"
                  maxLength={80}
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  title="Solo letras minúsculas, números y guiones"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/20 font-mono"
                />
              </div>
              {createSlug && (
                <p className="text-xs text-text-muted">URL: /p/{createSlug}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" isLoading={isPending}>
              Crear página
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setShowCreateForm(false); setCreateSlug(''); setCreateTitle('') }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Pages list */}
      {pages.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-muted border border-dashed border-border rounded-xl">
          No hay páginas personalizadas aún. Crea la primera.
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`flex items-center gap-3 px-4 py-3 bg-surface transition-colors ${!page.isActive ? 'opacity-50' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-text-primary">{page.title}</p>
                <p className="font-mono text-xs text-text-muted">/p/{page.slug}</p>
              </div>
              <span
                className={`text-xs font-sans px-2 py-0.5 rounded-full border ${
                  page.isActive
                    ? 'border-accent-gold/40 text-accent-gold bg-accent-gold/8'
                    : 'border-border text-text-muted bg-surface-2'
                }`}
              >
                {page.isActive ? 'Activa' : 'Inactiva'}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectPage(page)}
                  className="px-2.5 py-1 text-xs font-sans rounded border border-border bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(page)}
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
    </div>
  )
}
