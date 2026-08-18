'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import {
  AnnouncementBarSchema,
  HeroSchema,
  ShopByCategorySchema,
  ProductCarouselSchema,
  EditorialBlockSchema,
  SplitBlockSchema,
  BenefitsBlockSchema,
  NewsletterSchema,
  PromoBannerSchema,
} from '@/domains/cms/block-schemas'
import type { AdminSection } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SubFormProps = {
  content: unknown
  onSave: (content: unknown) => void
  isPending: boolean
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/20'

const textareaClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/20 resize-y'


// ---------------------------------------------------------------------------
// Sub-forms
// ---------------------------------------------------------------------------

function AnnouncementBarForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = AnnouncementBarSchema.safeParse(content)
  const d = parsed.success ? parsed.data : { text: '', bgColor: 'brand-black' as const }

  const [text, setText] = useState(d.text)
  const [linkText, setLinkText] = useState(d.linkText ?? '')
  const [linkHref, setLinkHref] = useState(d.linkHref ?? '')
  const [bgColor, setBgColor] = useState<'brand-black' | 'accent-gold'>(d.bgColor)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      text,
      linkText: linkText || undefined,
      linkHref: linkHref || undefined,
      bgColor,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Texto del anuncio">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          rows={2}
          required
          className={textareaClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Texto del enlace (opcional)">
          <input
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            maxLength={50}
            className={inputClass}
          />
        </Field>
        <Field label="URL del enlace (opcional)">
          <input
            value={linkHref}
            onChange={(e) => setLinkHref(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Color de fondo">
        <select
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value as 'brand-black' | 'accent-gold')}
          className={inputClass}
        >
          <option value="brand-black">Negro (brand-black)</option>
          <option value="accent-gold">Dorado (accent-gold)</option>
        </select>
      </Field>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

function HeroForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = HeroSchema.safeParse(content)
  const d = parsed.success
    ? parsed.data
    : {
        headline: '',
        subheadline: '',
        ctaPrimaryText: '',
        ctaPrimaryHref: '/',
        ctaSecondaryText: '',
        ctaSecondaryHref: '',
        imageDesktopUrl: '',
        imageMobileUrl: '',
        imageAlt: '',
        overlayOpacity: 0.3,
      }

  const [headline, setHeadline] = useState(d.headline)
  const [subheadline, setSubheadline] = useState(d.subheadline ?? '')
  const [ctaPrimaryText, setCtaPrimaryText] = useState(d.ctaPrimaryText)
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(d.ctaPrimaryHref)
  const [ctaSecondaryText, setCtaSecondaryText] = useState(d.ctaSecondaryText ?? '')
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(d.ctaSecondaryHref ?? '')
  const [imageDesktopUrl, setImageDesktopUrl] = useState(d.imageDesktopUrl)
  const [imageMobileUrl, setImageMobileUrl] = useState(d.imageMobileUrl)
  const [imageAlt, setImageAlt] = useState(d.imageAlt)
  const [overlayOpacity, setOverlayOpacity] = useState(String(d.overlayOpacity))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      headline,
      subheadline: subheadline || undefined,
      ctaPrimaryText,
      ctaPrimaryHref,
      ctaSecondaryText: ctaSecondaryText || undefined,
      ctaSecondaryHref: ctaSecondaryHref || undefined,
      imageDesktopUrl,
      imageMobileUrl,
      imageAlt,
      overlayOpacity: parseFloat(overlayOpacity) || 0.3,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Titular principal">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={100}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Subtitular (opcional)">
        <input
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          maxLength={200}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CTA primario — texto">
          <input
            value={ctaPrimaryText}
            onChange={(e) => setCtaPrimaryText(e.target.value)}
            maxLength={50}
            required
            className={inputClass}
          />
        </Field>
        <Field label="CTA primario — URL">
          <input
            value={ctaPrimaryHref}
            onChange={(e) => setCtaPrimaryHref(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="CTA secundario — texto (opcional)">
          <input
            value={ctaSecondaryText}
            onChange={(e) => setCtaSecondaryText(e.target.value)}
            maxLength={50}
            className={inputClass}
          />
        </Field>
        <Field label="CTA secundario — URL (opcional)">
          <input
            value={ctaSecondaryHref}
            onChange={(e) => setCtaSecondaryHref(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Imagen desktop — URL">
        <input
          value={imageDesktopUrl}
          onChange={(e) => setImageDesktopUrl(e.target.value)}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Imagen mobile — URL">
        <input
          value={imageMobileUrl}
          onChange={(e) => setImageMobileUrl(e.target.value)}
          required
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Alt de la imagen">
          <input
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            maxLength={150}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Opacidad del overlay (0 – 0.8)">
          <input
            type="number"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(e.target.value)}
            min={0}
            max={0.8}
            step={0.05}
            className={inputClass}
          />
        </Field>
      </div>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

function ShopByCategoryForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = ShopByCategorySchema.safeParse(content)
  const d = parsed.success
    ? parsed.data
    : { title: 'Compra por categoría', categories: [] }

  const [title, setTitle] = useState(d.title)
  const [categories, setCategories] = useState(d.categories)

  function updateCategory(idx: number, field: 'name' | 'slug' | 'imageUrl', value: string) {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  }

  function addCategory() {
    setCategories((prev) => [...prev, { name: '', slug: '', imageUrl: '' }])
  }

  function removeCategory(idx: number) {
    setCategories((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({ title, categories })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título de la sección">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className={inputClass}
        />
      </Field>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Categorías ({categories.length}/8)
          </label>
          {categories.length < 8 && (
            <button
              type="button"
              onClick={addCategory}
              className="text-xs text-accent-gold underline"
            >
              + Agregar
            </button>
          )}
        </div>
        {categories.map((cat, idx) => (
          <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">Categoría {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeCategory(idx)}
                className="text-xs text-error hover:underline"
              >
                Eliminar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Nombre"
                value={cat.name}
                onChange={(e) => updateCategory(idx, 'name', e.target.value)}
                required
                className={inputClass}
              />
              <input
                placeholder="Slug (ej: sandalias)"
                value={cat.slug}
                onChange={(e) => updateCategory(idx, 'slug', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <input
              placeholder="URL de imagen"
              value={cat.imageUrl}
              onChange={(e) => updateCategory(idx, 'imageUrl', e.target.value)}
              required
              className={inputClass}
            />
          </div>
        ))}
      </div>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

function ProductCarouselForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = ProductCarouselSchema.safeParse(content)
  const d = parsed.success
    ? parsed.data
    : { title: '', source: 'new' as const, limit: 8, bgVariant: 'default' as const, subtitle: undefined, collectionSlug: undefined, ctaText: undefined, ctaHref: undefined }

  const [title, setTitle] = useState(d.title)
  const [subtitle, setSubtitle] = useState(d.subtitle ?? '')
  const [source, setSource] = useState(d.source)
  const [collectionSlug, setCollectionSlug] = useState(d.collectionSlug ?? '')
  const [limit, setLimit] = useState(String(d.limit))
  const [ctaText, setCtaText] = useState(d.ctaText ?? '')
  const [ctaHref, setCtaHref] = useState(d.ctaHref ?? '')
  const [bgVariant, setBgVariant] = useState(d.bgVariant ?? 'default')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      title,
      subtitle: subtitle || undefined,
      source,
      collectionSlug: source === 'collection' ? collectionSlug : undefined,
      limit: parseInt(limit) || 8,
      ctaText: ctaText || undefined,
      ctaHref: ctaHref || undefined,
      bgVariant,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Subtítulo (opcional)">
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={150}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fuente de productos">
          <select
            value={source}
            onChange={(e) =>
              setSource(e.target.value as 'new' | 'bestseller' | 'featured' | 'collection')
            }
            className={inputClass}
          >
            <option value="new">Nuevos</option>
            <option value="bestseller">Más vendidos</option>
            <option value="featured">Destacados</option>
            <option value="collection">Colección</option>
          </select>
        </Field>
        <Field label="Slug de colección (si fuente = colección)">
          <input
            value={collectionSlug}
            onChange={(e) => setCollectionSlug(e.target.value)}
            disabled={source !== 'collection'}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cantidad de productos (4–12)">
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            min={4}
            max={12}
            className={inputClass}
          />
        </Field>
        <Field label="Texto del CTA (opcional)">
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            maxLength={50}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="URL del CTA (opcional)">
        <input
          value={ctaHref}
          onChange={(e) => setCtaHref(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Fondo">
        <select
          value={bgVariant}
          onChange={(e) => setBgVariant(e.target.value as 'default' | 'sand')}
          className={inputClass}
        >
          <option value="default">Transparente (por defecto)</option>
          <option value="sand">Arena (#F1EFEA)</option>
        </select>
      </Field>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

function EditorialBlockForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = EditorialBlockSchema.safeParse(content)
  const d = parsed.success
    ? parsed.data
    : {
        headline: '',
        body: '',
        imageUrl: '',
        imageAlt: '',
        imagePosition: 'right' as const,
      }

  const [eyebrow, setEyebrow] = useState(d.eyebrow ?? '')
  const [headline, setHeadline] = useState(d.headline)
  const [body, setBody] = useState(d.body)
  const [ctaText, setCtaText] = useState(d.ctaText ?? '')
  const [ctaHref, setCtaHref] = useState(d.ctaHref ?? '')
  const [imageUrl, setImageUrl] = useState(d.imageUrl)
  const [imageAlt, setImageAlt] = useState(d.imageAlt)
  const [imagePosition, setImagePosition] = useState<'left' | 'right'>(d.imagePosition)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      eyebrow: eyebrow || undefined,
      headline,
      body,
      ctaText: ctaText || undefined,
      ctaHref: ctaHref || undefined,
      imageUrl,
      imageAlt,
      imagePosition,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Eyebrow (opcional)">
        <input
          value={eyebrow}
          onChange={(e) => setEyebrow(e.target.value)}
          maxLength={50}
          className={inputClass}
        />
      </Field>
      <Field label="Titular">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={100}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Cuerpo del texto">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          rows={4}
          required
          className={textareaClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Texto del CTA (opcional)">
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            maxLength={50}
            className={inputClass}
          />
        </Field>
        <Field label="URL del CTA (opcional)">
          <input
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="URL de imagen">
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Alt de la imagen">
          <input
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            maxLength={150}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Posición de la imagen">
          <select
            value={imagePosition}
            onChange={(e) => setImagePosition(e.target.value as 'left' | 'right')}
            className={inputClass}
          >
            <option value="right">Derecha</option>
            <option value="left">Izquierda</option>
          </select>
        </Field>
      </div>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

function SplitBlockForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = SplitBlockSchema.safeParse(content)
  const d = parsed.success
    ? parsed.data
    : {
        leftLabel: 'Mujer',
        leftHref: '/mujer',
        leftImageUrl: '',
        rightLabel: 'Hombre',
        rightHref: '/hombre',
        rightImageUrl: '',
      }

  const [leftLabel, setLeftLabel] = useState(d.leftLabel)
  const [leftHref, setLeftHref] = useState(d.leftHref)
  const [leftImageUrl, setLeftImageUrl] = useState(d.leftImageUrl)
  const [rightLabel, setRightLabel] = useState(d.rightLabel)
  const [rightHref, setRightHref] = useState(d.rightHref)
  const [rightImageUrl, setRightImageUrl] = useState(d.rightImageUrl)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({ leftLabel, leftHref, leftImageUrl, rightLabel, rightHref, rightImageUrl })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Panel izquierdo
          </p>
          <Field label="Etiqueta">
            <input
              value={leftLabel}
              onChange={(e) => setLeftLabel(e.target.value)}
              maxLength={50}
              required
              className={inputClass}
            />
          </Field>
          <Field label="URL">
            <input
              value={leftHref}
              onChange={(e) => setLeftHref(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="URL de imagen">
            <input
              value={leftImageUrl}
              onChange={(e) => setLeftImageUrl(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Panel derecho
          </p>
          <Field label="Etiqueta">
            <input
              value={rightLabel}
              onChange={(e) => setRightLabel(e.target.value)}
              maxLength={50}
              required
              className={inputClass}
            />
          </Field>
          <Field label="URL">
            <input
              value={rightHref}
              onChange={(e) => setRightHref(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="URL de imagen">
            <input
              value={rightImageUrl}
              onChange={(e) => setRightImageUrl(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
        </div>
      </div>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

function BenefitsBlockForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = BenefitsBlockSchema.safeParse(content)
  const d = parsed.success ? parsed.data : { title: '', benefits: [] }

  type BenefitIcon = 'truck' | 'shield' | 'refresh' | 'star' | 'whatsapp' | 'credit-card'
  type Benefit = { icon: BenefitIcon; title: string; description: string }

  const [title, setTitle] = useState(d.title ?? '')
  const [benefits, setBenefits] = useState<Benefit[]>(d.benefits as Benefit[])

  function updateBenefit(idx: number, field: keyof Benefit, value: string) {
    setBenefits((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)))
  }

  function addBenefit() {
    setBenefits((prev) => [
      ...prev,
      { icon: 'truck' as BenefitIcon, title: '', description: '' },
    ])
  }

  function removeBenefit(idx: number) {
    setBenefits((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({ title: title || undefined, benefits })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título de la sección (opcional)">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className={inputClass}
        />
      </Field>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Beneficios ({benefits.length}/6)
          </label>
          {benefits.length < 6 && (
            <button
              type="button"
              onClick={addBenefit}
              className="text-xs text-accent-gold underline"
            >
              + Agregar
            </button>
          )}
        </div>
        {benefits.map((benefit, idx) => (
          <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">Beneficio {idx + 1}</span>
              {benefits.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeBenefit(idx)}
                  className="text-xs text-error hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={benefit.icon}
                onChange={(e) => updateBenefit(idx, 'icon', e.target.value)}
                className={inputClass}
              >
                <option value="truck">Camión (envíos)</option>
                <option value="shield">Escudo (seguridad)</option>
                <option value="refresh">Flecha (cambios)</option>
                <option value="star">Estrella</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="credit-card">Tarjeta de crédito</option>
              </select>
              <input
                placeholder="Título"
                value={benefit.title}
                onChange={(e) => updateBenefit(idx, 'title', e.target.value)}
                maxLength={60}
                required
                className={inputClass}
              />
            </div>
            <input
              placeholder="Descripción"
              value={benefit.description}
              onChange={(e) => updateBenefit(idx, 'description', e.target.value)}
              maxLength={150}
              required
              className={inputClass}
            />
          </div>
        ))}
      </div>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

function NewsletterForm({ content, onSave, isPending }: SubFormProps) {
  const parsed = NewsletterSchema.safeParse(content)
  const d = parsed.success
    ? parsed.data
    : {
        headline: 'Únete a la comunidad SAVAYA',
        subheadline: '',
        placeholder: 'Tu correo electrónico',
        ctaText: 'Suscribirme',
      }

  const [headline, setHeadline] = useState(d.headline)
  const [subheadline, setSubheadline] = useState(d.subheadline ?? '')
  const [placeholder, setPlaceholder] = useState(d.placeholder)
  const [ctaText, setCtaText] = useState(d.ctaText)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      headline,
      subheadline: subheadline || undefined,
      placeholder,
      ctaText,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Titular">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={100}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Subtítulo (opcional)">
        <input
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          maxLength={200}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Placeholder del campo">
          <input
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            maxLength={60}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Texto del botón">
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            maxLength={40}
            required
            className={inputClass}
          />
        </Field>
      </div>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// PromoBannerForm
// ---------------------------------------------------------------------------

function PromoBannerForm({ content, onSave, isPending }: SubFormProps) {
  const d = PromoBannerSchema.parse(content)
  const [headline, setHeadline] = useState(d.headline)
  const [subheadline, setSubheadline] = useState(d.subheadline ?? '')
  const [ctaText, setCtaText] = useState(d.ctaText)
  const [ctaHref, setCtaHref] = useState(d.ctaHref)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      headline,
      subheadline: subheadline || undefined,
      ctaText,
      ctaHref,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Titular">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={80}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Subtítulo (opcional)">
        <input
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          maxLength={150}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Texto del botón">
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            maxLength={50}
            required
            className={inputClass}
          />
        </Field>
        <Field label="URL del botón">
          <input
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
      </div>
      <Button type="submit" isLoading={isPending} size="sm">
        Guardar bloque
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main switch component
// ---------------------------------------------------------------------------

type Props = {
  section: AdminSection
  onSave: (content: unknown) => void
  isPending: boolean
}

export function BlockContentForm({ section, onSave, isPending }: Props) {
  if (section.type === 'banner_row') {
    return (
      <div className="p-4 bg-surface-2 border border-border rounded-lg text-sm text-text-secondary">
        La fila de banners no se edita aquí — gestiona los banners individuales desde la
        pestaña <strong>Banners</strong>.
      </div>
    )
  }

  switch (section.type) {
    case 'announcement_bar':
      return (
        <AnnouncementBarForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    case 'hero':
      return <HeroForm content={section.content} onSave={onSave} isPending={isPending} />
    case 'shop_by_category':
      return (
        <ShopByCategoryForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    case 'product_carousel':
      return (
        <ProductCarouselForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    case 'editorial_block':
      return (
        <EditorialBlockForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    case 'split_block':
      return (
        <SplitBlockForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    case 'benefits_block':
      return (
        <BenefitsBlockForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    case 'newsletter':
      return (
        <NewsletterForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    case 'promo_banner':
      return (
        <PromoBannerForm content={section.content} onSave={onSave} isPending={isPending} />
      )
    default:
      return (
        <p className="text-sm text-text-secondary">
          Tipo de bloque no reconocido: {section.type}
        </p>
      )
  }
}
