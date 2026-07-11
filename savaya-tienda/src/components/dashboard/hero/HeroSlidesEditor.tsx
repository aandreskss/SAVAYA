'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveHeroSlide, deleteHeroSlide, updateSlidesOrder } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  id: string
  sort_order: number
  eyebrow: string
  title: string
  description: string
  cta: string
  href: string
  cta2: string
  href2: string
  image_url: string
  mobile_image_url: string
  image_href: string
  accent: string
  is_active: boolean
}

// ─── SlideCard ────────────────────────────────────────────────────────────────

interface SlideCardProps {
  slide: Slide
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onDeleted: () => void
}

function SlideCard({ slide, index, total, onMoveUp, onMoveDown, onDeleted }: SlideCardProps) {
  const router = useRouter()
  const isNew = !slide.id || slide.id.startsWith('_new')
  const [expanded, setExpanded] = useState(isNew)
  const [form, setForm] = useState(slide)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mobileFileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof Slide>(key: K, value: Slide[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?folder=savaya/hero', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      set('image_url', data.url ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  async function handleUploadMobile(file: File) {
    setUploadingMobile(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?folder=savaya/hero', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      set('mobile_image_url', data.url ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploadingMobile(false)
    }
  }

  async function handleSave() {
    const hasContent = form.title.trim() || form.cta.trim() || form.image_href.trim()
    if (!hasContent) {
      setError('El slide debe tener al menos un título, un botón o un enlace en la imagen.')
      return
    }
    if (form.cta.trim() && !form.href.trim()) {
      setError('El botón principal necesita una URL destino.')
      return
    }
    setSaving(true)
    setError('')
    const result = await saveHeroSlide({ ...form, sort_order: index })
    setSaving(false)
    if ('error' in result) {
      setError(result.error ?? 'Error al guardar')
    } else {
      setSuccess(true)
      if (isNew) router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este slide? Esta acción no se puede deshacer.')) return
    if (isNew) { onDeleted(); return }
    setDeleting(true)
    await deleteHeroSlide(slide.id)
    onDeleted()
  }

  return (
    <div className={`bg-white rounded border transition-colors ${expanded ? 'border-black' : 'border-gray-light'}`}>
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Order controls */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="Subir"
            className="w-5 h-5 flex items-center justify-center text-gray-text hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Bajar"
            className="w-5 h-5 flex items-center justify-center text-gray-text hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Thumbnail */}
        <div className="w-14 h-9 rounded overflow-hidden bg-gray-bg border border-gray-light shrink-0">
          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-text">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Title + eyebrow */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-semibold text-black truncate">
            {form.title || <span className="text-gray-text italic font-normal">Sin título</span>}
          </p>
          {form.eyebrow && (
            <p className="text-[11px] text-gray-text truncate">{form.eyebrow}</p>
          )}
        </div>

        {/* Active toggle */}
        <button
          onClick={() => set('is_active', !form.is_active)}
          title={form.is_active ? 'Desactivar' : 'Activar'}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.is_active ? 'translate-x-4' : ''}`}
          />
        </button>

        {/* Expand */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-7 h-7 flex items-center justify-center text-gray-text hover:text-black transition-colors rounded hover:bg-gray-bg shrink-0"
          title={expanded ? 'Colapsar' : 'Editar'}
        >
          <svg
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Eliminar slide"
          className="w-7 h-7 flex items-center justify-center text-gray-text hover:text-red-600 disabled:opacity-50 transition-colors rounded hover:bg-red-50 shrink-0"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      {/* ── Expanded form ──────────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-gray-light px-4 py-5 space-y-5">

          {/* Image */}
          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2">
              Imagen de fondo
            </p>
            {form.image_url && (
              <div className="relative mb-3 rounded overflow-hidden border border-gray-light" style={{ height: 160 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('image_url', '')}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center text-sm transition-colors"
                >×</button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="url"
                value={form.image_url}
                onChange={e => set('image_url', e.target.value)}
                placeholder="https://... o sube una imagen →"
                className="flex-1 h-8 border border-gray-light rounded px-2.5 text-xs focus:outline-none focus:border-black transition-colors"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f)
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 h-8 border border-gray-light rounded text-xs font-heading font-semibold text-gray-text hover:border-black hover:text-black transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {uploading ? (
                  <span className="w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                Subir
              </button>
            </div>
            <p className="text-[11px] text-gray-text font-body mt-1.5">
              JPG o PNG · Recomendado: <span className="font-semibold text-black">1920 × 900 px</span> (horizontal) · Mín. 1400 × 600 px · Máx. 5 MB
            </p>
          </div>

          {/* Mobile image */}
          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
              Imagen para móvil <span className="normal-case font-normal">(opcional)</span>
            </p>
            <p className="text-[11px] text-gray-text font-body mb-2">
              Si no se sube, se usará la imagen de escritorio. Para mejor resultado usa una imagen vertical.
            </p>
            {form.mobile_image_url && (
              <div className="relative mb-3 rounded overflow-hidden border border-gray-light" style={{ height: 120 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.mobile_image_url} alt="" className="w-full h-full object-cover object-top" />
                <button
                  type="button"
                  onClick={() => set('mobile_image_url', '')}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center text-sm transition-colors"
                >×</button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="url"
                value={form.mobile_image_url}
                onChange={e => set('mobile_image_url', e.target.value)}
                placeholder="https://... o sube una imagen →"
                className="flex-1 h-8 border border-gray-light rounded px-2.5 text-xs focus:outline-none focus:border-black transition-colors"
              />
              <input
                ref={mobileFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadMobile(f)
                }}
              />
              <button
                type="button"
                disabled={uploadingMobile}
                onClick={() => mobileFileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 h-8 border border-gray-light rounded text-xs font-heading font-semibold text-gray-text hover:border-black hover:text-black transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {uploadingMobile ? (
                  <span className="w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                Subir
              </button>
            </div>
            <p className="text-[11px] text-gray-text font-body mt-1.5">
              JPG o PNG · Recomendado: <span className="font-semibold text-black">750 × 1100 px</span> (vertical) · Máx. 5 MB
            </p>
          </div>

          {/* Image link (image-only mode) */}
          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
              Enlace al hacer clic en la imagen <span className="normal-case font-normal">(opcional)</span>
            </p>
            <input
              type="url"
              value={form.image_href}
              onChange={e => set('image_href', e.target.value)}
              placeholder="/mujer, /descuentos, https://..."
              className="w-full h-8 border border-gray-light rounded px-2.5 text-sm focus:outline-none focus:border-black transition-colors"
            />
            <p className="text-[11px] text-gray-text font-body mt-1">
              Si no hay título ni botones, la imagen completa será clickeable y se mostrará sin overlay de texto.
            </p>
          </div>

          {/* Eyebrow + Accent */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Eyebrow (texto pequeño arriba)"
              value={form.eyebrow}
              onChange={v => set('eyebrow', v)}
              placeholder="Nueva Colección — Primavera 2026"
            />
            <div>
              <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
                Color del eyebrow
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set('accent', 'gold')}
                  className={`flex-1 h-8 rounded text-xs font-heading font-semibold border transition-colors ${
                    form.accent === 'gold'
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                      : 'border-gray-light text-gray-text hover:border-gray-400'
                  }`}
                >
                  Dorado
                </button>
                <button
                  type="button"
                  onClick={() => set('accent', 'sale')}
                  className={`flex-1 h-8 rounded text-xs font-heading font-semibold border transition-colors ${
                    form.accent === 'sale'
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : 'border-gray-light text-gray-text hover:border-gray-400'
                  }`}
                >
                  Rojo
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <Field
            label="Título principal *"
            value={form.title}
            onChange={v => set('title', v)}
            placeholder="El estilo que mereces, al alcance de todos"
          />

          {/* Description */}
          <div>
            <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Las últimas tendencias para mujer, hombre y niños."
              rows={2}
              className="w-full border border-gray-light rounded px-2.5 py-2 text-sm focus:outline-none focus:border-black transition-colors resize-none"
            />
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Botón principal — texto *"
              value={form.cta}
              onChange={v => set('cta', v)}
              placeholder="Ver colección"
            />
            <Field
              label="Botón principal — URL *"
              value={form.href}
              onChange={v => set('href', v)}
              placeholder="/nuevas-colecciones"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Botón secundario — texto"
              value={form.cta2}
              onChange={v => set('cta2', v)}
              placeholder="Explorar categorías (opcional)"
            />
            <Field
              label="Botón secundario — URL"
              value={form.href2}
              onChange={v => set('href2', v)}
              placeholder="/mujer"
            />
          </div>

          {/* Error / success */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              ✓ Cambios guardados correctamente
            </p>
          )}

          {/* Save */}
          <div className="flex items-center gap-3 pt-1">
            <button
              disabled={saving || uploading}
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white font-heading font-semibold text-xs rounded hover:bg-accent transition-colors disabled:opacity-50"
            >
              {saving && (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Guardar slide
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Field helper (defined outside — stable identity) ─────────────────────────

function Field({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 border border-gray-light rounded px-2.5 text-sm focus:outline-none focus:border-black transition-colors"
      />
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

const EMPTY_SLIDE: Slide = {
  id: '',
  sort_order: 0,
  eyebrow: '',
  title: '',
  description: '',
  cta: '',
  href: '',
  cta2: '',
  href2: '',
  image_url: '',
  mobile_image_url: '',
  image_href: '',
  accent: 'gold',
  is_active: true,
}

export default function HeroSlidesEditor({ initialSlides }: { initialSlides: Slide[] }) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides)

  function addSlide() {
    const newSlide = { ...EMPTY_SLIDE, id: `_new_${Date.now()}`, sort_order: slides.length }
    setSlides(prev => [...prev, newSlide])
  }

  function removeSlide(index: number) {
    setSlides(prev => prev.filter((_, i) => i !== index))
  }

  async function moveUp(index: number) {
    if (index === 0) return
    const next = [...slides]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setSlides(next)
    const savedIds = next.map(s => s.id).filter(id => id && !id.startsWith('_new'))
    if (savedIds.length > 0) await updateSlidesOrder(savedIds)
  }

  async function moveDown(index: number) {
    if (index === slides.length - 1) return
    const next = [...slides]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setSlides(next)
    const savedIds = next.map(s => s.id).filter(id => id && !id.startsWith('_new'))
    if (savedIds.length > 0) await updateSlidesOrder(savedIds)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-text font-body">
          {slides.length} slide{slides.length !== 1 ? 's' : ''} · Solo los activos se muestran en la tienda
        </p>
        <button
          onClick={addSlide}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-heading font-semibold text-xs rounded hover:bg-accent transition-colors"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo slide
        </button>
      </div>

      {slides.length === 0 && (
        <div className="bg-white rounded border border-dashed border-gray-light py-12 text-center">
          <p className="text-sm text-gray-text">No hay slides. Agrega uno para empezar.</p>
        </div>
      )}

      <div className="space-y-3">
        {slides.map((slide, index) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
            onMoveUp={() => moveUp(index)}
            onMoveDown={() => moveDown(index)}
            onDeleted={() => removeSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
