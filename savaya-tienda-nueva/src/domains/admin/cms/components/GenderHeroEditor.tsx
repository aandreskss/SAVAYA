'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/Button'
import { ImageUploader } from './ImageUploader'
import { UrlPicker } from '@/shared/ui/UrlPicker'
import { toast } from '@/shared/ui/toast-store'
import { updateGenderHeroAction, type GenderHeroPayload } from '../actions'
import type { GenderHero } from '@/domains/cms/repository'

type Props = {
  slug: 'hombre' | 'mujer'
  initial: GenderHero | null
}

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/20'

const labelClass = 'text-xs font-medium text-text-secondary uppercase tracking-wide'

const DEFAULTS: Record<'hombre' | 'mujer', GenderHero> = {
  hombre: {
    imageDesktopUrl: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1600&q=80',
    overlayOpacity: 0.88,
    tagline: 'Sneakers · Botas · Loafers · Zapatos Formales',
    ctaPrimaryText: 'Ver Sneakers',
    ctaPrimaryHref: '/hombre/categoria/sneakers',
    ctaSecondaryText: 'Botas',
    ctaSecondaryHref: '/hombre/categoria/botas',
  },
  mujer: {
    imageDesktopUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1600&q=80',
    overlayOpacity: 0.72,
    tagline: 'Sandalias · Tacones · Plataformas · Flats · Botas',
    ctaPrimaryText: 'Ver Sandalias',
    ctaPrimaryHref: '/mujer/categoria/sandalias',
    ctaSecondaryText: 'Tacones',
    ctaSecondaryHref: '/mujer/categoria/tacones',
  },
}

export function GenderHeroEditor({ slug, initial }: Props) {
  const defaults = DEFAULTS[slug]
  const data = initial ?? defaults

  const [imageDesktopUrl, setImageDesktopUrl] = useState(data.imageDesktopUrl)
  const [overlayOpacity, setOverlayOpacity] = useState(String(data.overlayOpacity))
  const [tagline, setTagline] = useState(initial ? (initial.tagline ?? '') : (defaults.tagline ?? ''))
  const [ctaPrimaryText, setCtaPrimaryText] = useState(data.ctaPrimaryText)
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(data.ctaPrimaryHref)
  const [ctaSecondaryText, setCtaSecondaryText] = useState(data.ctaSecondaryText ?? '')
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(data.ctaSecondaryHref ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: GenderHeroPayload = {
      imageDesktopUrl,
      overlayOpacity: parseFloat(overlayOpacity) || defaults.overlayOpacity,
      tagline,
      ctaPrimaryText,
      ctaPrimaryHref,
      ctaSecondaryText,
      ctaSecondaryHref,
    }
    startTransition(async () => {
      const result = await updateGenderHeroAction(slug, payload)
      if (result.success) {
        toast.success('Banner guardado')
      } else {
        toast.error(result.error)
      }
    })
  }

  const label = slug === 'hombre' ? 'Hombre' : 'Mujer'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <p className="text-sm text-text-secondary">
        Configura el banner hero de la página <strong>/{slug}</strong>. El título "Para {slug === 'hombre' ? 'Él' : 'Ella'}" es fijo de marca.
      </p>

      <ImageUploader
        label={`Imagen de fondo — ${label}`}
        hint="1600 × 900 px mínimo · horizontal"
        value={imageDesktopUrl}
        onChange={setImageDesktopUrl}
        required
      />

      <div className="space-y-1">
        <label className={labelClass}>
          Intensidad del overlay oscuro (0 = sin overlay, 0.9 = muy oscuro)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(e.target.value)}
            className="flex-1 accent-[var(--color-accent-gold)]"
          />
          <span className="text-sm tabular-nums w-10 text-right text-text-secondary">
            {parseFloat(overlayOpacity).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Tagline del hero</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={100}
          className={inputClass}
          placeholder={defaults.tagline ?? 'Ej: Sneakers · Botas · Loafers'}
        />
        <p className="text-xs text-text-secondary">
          Texto descriptivo bajo el título "Para {slug === 'hombre' ? 'Él' : 'Ella'}". Dejar vacío para ocultar.
        </p>
      </div>

      <div className="border border-border rounded-lg p-4 space-y-3">
        <p className={labelClass}>Botón principal</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Texto</label>
            <input
              required
              value={ctaPrimaryText}
              onChange={(e) => setCtaPrimaryText(e.target.value)}
              maxLength={50}
              className={inputClass}
              placeholder="Ver colección"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">URL</label>
            <UrlPicker
              value={ctaPrimaryHref}
              onChange={setCtaPrimaryHref}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 space-y-3">
        <p className={labelClass}>Botón secundario <span className="normal-case font-normal">(opcional)</span></p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Texto</label>
            <input
              value={ctaSecondaryText}
              onChange={(e) => setCtaSecondaryText(e.target.value)}
              maxLength={50}
              className={inputClass}
              placeholder="Dejar vacío para ocultar"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">URL</label>
            <UrlPicker
              value={ctaSecondaryHref}
              onChange={setCtaSecondaryHref}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <Button type="submit" isLoading={isPending}>
        Guardar banner /{slug}
      </Button>
    </form>
  )
}
