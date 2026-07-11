'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { saveBanner } from './actions'
import type { BannerConfig } from '@/lib/types'

const BANNER_SECTIONS = [
  {
    title: 'Banners Home — Pantalla Completa',
    desc: 'Aparecen entre secciones de la homepage como banners anchos.',
    ids: ['home_full_1', 'home_full_2'],
    labels: { home_full_1: 'Banner 1 (debajo de categorías)', home_full_2: 'Banner 2 (debajo de Colección Mujer/Hombre)' },
    sizeHint: 'Tamaño ideal: 1400 × 600 px (horizontal)',
  },
  {
    title: 'Banners Home — Doble',
    desc: 'Dos banners lado a lado en la sección "Colección Mujer / Colección Hombre".',
    ids: ['home_dual_mujer', 'home_dual_hombre'],
    labels: { home_dual_mujer: 'Mujer', home_dual_hombre: 'Hombre' },
    sizeHint: 'Tamaño ideal: 700 × 900 px (vertical)',
  },
  {
    title: 'Banners Mega Menú (Navbar)',
    desc: 'Banda promocional al fondo del mega menú de cada categoría principal.',
    ids: ['nav_mujer', 'nav_hombre', 'nav_ninos'],
    labels: { nav_mujer: 'Mega menú Mujer', nav_hombre: 'Mega menú Hombre', nav_ninos: 'Mega menú Niños' },
    sizeHint: 'Tamaño ideal: 600 × 400 px (horizontal)',
  },
]

interface BannerCardProps {
  banner: BannerConfig
  label: string
  sizeHint?: string
}

function BannerCard({ banner, label, sizeHint }: BannerCardProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localActive, setLocalActive] = useState(banner.is_active)
  const [uploadingImg, setUploadingImg] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)

  const [imageOnly, setImageOnly] = useState(banner.image_only ?? false)

  const [fields, setFields] = useState({
    image_url: banner.image_url ?? '',
    title: banner.title ?? '',
    subtitle: banner.subtitle ?? '',
    badge: banner.badge ?? '',
    cta_text: banner.cta_text ?? '',
    href: banner.href ?? '',
  })

  function handleChange(key: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?folder=savaya/banners', { method: 'POST', body: fd })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Error al subir imagen')
      handleChange('image_url', json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploadingImg(false)
      if (imgInputRef.current) imgInputRef.current.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setError(null)
    startTransition(async () => {
      try {
        await saveBanner(banner.id, {
          ...fields,
          image_url: fields.image_url || null,
          badge: fields.badge || null,
          is_active: localActive,
          image_only: imageOnly,
        })
        setSaved(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleToggleActive() {
    const newActive = !localActive
    setLocalActive(newActive)
    startTransition(async () => {
      await saveBanner(banner.id, { is_active: newActive })
    })
  }

  return (
    <div className="bg-white border border-gray-light rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-light bg-gray-bg">
        <p className="text-sm font-heading font-semibold text-black">{label}</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-gray-text">{localActive ? 'Activo' : 'Inactivo'}</span>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isPending}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${localActive ? 'bg-black' : 'bg-gray-light'}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${localActive ? 'translate-x-4' : 'translate-x-1'}`}
            />
          </button>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Image upload */}
        <div>
          <p className="text-xs font-heading font-medium text-black mb-1.5">Imagen del banner</p>
          <div className="flex items-start gap-3">
            {fields.image_url ? (
              <div className="relative w-32 h-20 rounded overflow-hidden border border-gray-light shrink-0">
                <Image
                  src={fields.image_url}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={() => handleChange('image_url', '')}
                />
              </div>
            ) : (
              <div className="w-32 h-20 rounded border-2 border-dashed border-gray-light flex items-center justify-center shrink-0 bg-gray-bg">
                <span className="text-[10px] text-gray-text font-body text-center px-1">Sin imagen</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                disabled={uploadingImg || isPending}
                className="h-8 px-3 border border-gray-light rounded text-xs font-heading font-semibold hover:bg-gray-bg transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {uploadingImg ? (
                  <>
                    <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                    Subiendo…
                  </>
                ) : (
                  fields.image_url ? 'Cambiar imagen' : 'Subir imagen'
                )}
              </button>
              {fields.image_url && (
                <button
                  type="button"
                  onClick={() => handleChange('image_url', '')}
                  className="text-xs text-gray-text hover:text-sale font-body text-left"
                >
                  Quitar imagen
                </button>
              )}
              {sizeHint && (
                <p className="text-[11px] text-gray-text font-body">{sizeHint}</p>
              )}
            </div>
          </div>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-heading font-medium text-black mb-1">Título</label>
            <input
              type="text"
              value={fields.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-heading font-medium text-black mb-1">Badge / Etiqueta</label>
            <input
              type="text"
              value={fields.badge}
              onChange={(e) => handleChange('badge', e.target.value)}
              placeholder="Ej: Oferta especial"
              className="w-full h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-heading font-medium text-black mb-1">Subtítulo</label>
          <input
            type="text"
            value={fields.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            className="w-full h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-heading font-medium text-black mb-1">Texto del botón (CTA)</label>
            <input
              type="text"
              value={fields.cta_text}
              onChange={(e) => handleChange('cta_text', e.target.value)}
              placeholder="Ver más"
              className="w-full h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-heading font-medium text-black mb-1">Enlace (href)</label>
            <input
              type="text"
              value={fields.href}
              onChange={(e) => handleChange('href', e.target.value)}
              placeholder="/remates"
              className="w-full h-9 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Image-only toggle */}
        <div className="border border-gray-light rounded p-3 flex items-start gap-3">
          <button
            type="button"
            onClick={() => { setImageOnly((v) => !v); setSaved(false) }}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors mt-0.5 ${imageOnly ? 'bg-black' : 'bg-gray-light'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${imageOnly ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <div>
            <p className="text-xs font-heading font-semibold text-black">Modo imagen sola</p>
            <p className="text-[11px] text-gray-text mt-0.5">La imagen ocupa todo el banner sin texto ni sombra. El enlace (href) sigue siendo obligatorio para hacer el banner clickeable.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="h-9 px-4 bg-black text-white text-xs font-heading font-semibold rounded hover:bg-accent transition-colors disabled:opacity-40"
          >
            {isPending ? 'Guardando…' : 'Guardar banner'}
          </button>
          {saved && !isPending && <span className="text-xs text-green-600 font-medium">✓ Guardado</span>}
          {error && !isPending && <span className="text-xs text-sale">{error}</span>}
        </div>
      </form>
    </div>
  )
}

export default function BannersEditor({ banners }: { banners: BannerConfig[] }) {
  const bannerMap = new Map(banners.map((b) => [b.id, b]))

  return (
    <div className="space-y-10">
      {BANNER_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="mb-4">
            <h2 className="font-heading font-semibold text-base text-black">{section.title}</h2>
            <p className="text-xs text-gray-text mt-0.5">{section.desc}</p>
          </div>
          <div className="space-y-4">
            {section.ids.map((id) => {
              const banner = bannerMap.get(id)
              if (!banner) {
                return (
                  <div key={id} className="p-4 border border-dashed border-gray-light rounded-lg text-center text-sm text-gray-text">
                    Banner &quot;{id}&quot; no encontrado. Asegúrate de haber ejecutado el SQL inicial.
                  </div>
                )
              }
              return (
                <BannerCard
                  key={id}
                  banner={banner}
                  label={(section.labels as unknown as Record<string, string>)[id] ?? id}
                  sizeHint={section.sizeHint}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
