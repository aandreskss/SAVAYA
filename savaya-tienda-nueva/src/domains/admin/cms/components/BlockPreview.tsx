/* eslint-disable @next/next/no-img-element */
'use client'

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
  SocialProofGridSchema,
} from '@/domains/cms/block-schemas'
import type { AdminSection } from '../types'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function Thumb({
  src,
  alt = '',
  label,
  className = '',
}: {
  src: string
  alt?: string
  label?: string
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed border-border rounded-[inherit]">
          <span className="text-[9px] text-text-secondary">Sin imagen</span>
        </div>
      )}
      {label && (
        <div className="absolute top-1 left-1 bg-black/65 rounded px-1.5 py-0.5 z-10">
          <span className="text-[9px] font-semibold text-white leading-none">{label}</span>
        </div>
      )}
    </div>
  )
}

function Overlay({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none ${className}`} />
  )
}

// ---------------------------------------------------------------------------
// Block-specific previews
// ---------------------------------------------------------------------------

function AnnouncementBarPreview({ content }: { content: unknown }) {
  const d = AnnouncementBarSchema.safeParse(content)
  const text = d.success ? d.data.text : 'Texto del anuncio aparecerá aquí'
  const isGold = d.success && d.data.bgColor === 'accent-gold'

  return (
    <div
      className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center ${
        isGold ? 'bg-[#C9A227]' : 'bg-[#111111] border border-border'
      }`}
    >
      <p className={`text-xs text-center truncate ${isGold ? 'text-black font-semibold' : 'text-white'}`}>
        {text}
      </p>
    </div>
  )
}

function HeroPreview({ content }: { content: unknown }) {
  const d = HeroSchema.safeParse(content)
  const desktopUrl = d.success ? d.data.imageDesktopUrl : ''
  const mobileUrl = d.success ? d.data.imageMobileUrl : ''
  const headline = d.success ? d.data.headline : 'Titular del hero'
  const ctaText = d.success ? d.data.ctaPrimaryText : 'Ver más'

  return (
    <div className="flex gap-2 w-full">
      {/* Desktop */}
      <div className="relative flex-1 rounded-xl overflow-hidden" style={{ height: 120 }}>
        <Thumb src={desktopUrl} label="Desktop · 1920 × 700 px" className="absolute inset-0 w-full h-full rounded-xl" />
        <Overlay />
        <div className="absolute inset-0 flex flex-col justify-end p-3 z-10">
          <p className="text-[10px] font-black text-white uppercase leading-tight truncate">{headline}</p>
          {ctaText && (
            <span className="mt-1 self-start bg-[#C9A227] text-[8px] font-bold px-2 py-0.5 rounded-full text-black">
              {ctaText}
            </span>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 52, height: 120 }}>
        <Thumb src={mobileUrl} label="" className="absolute inset-0 w-full h-full rounded-xl" />
        <Overlay />
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center z-10">
          <span className="text-[8px] font-semibold text-white leading-none">750×1000</span>
          <span className="text-[8px] text-white/60 leading-none">mobile</span>
        </div>
      </div>
    </div>
  )
}

function ShopByCategoryPreview({ content }: { content: unknown }) {
  const d = ShopByCategorySchema.safeParse(content)
  const categories = d.success ? d.data.categories.slice(0, 5) : []
  const title = d.success ? d.data.title : 'Compra por categoría'

  return (
    <div className="w-full space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-primary truncate">{title}</p>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: '1.5fr 1fr 1fr', gridTemplateRows: '52px 52px' }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const cat = categories[i]
          return (
            <div
              key={i}
              className={`relative rounded-xl overflow-hidden ${i === 0 ? '[grid-row:span_2]' : ''}`}
            >
              <Thumb
                src={cat?.imageUrl ?? ''}
                alt={cat?.name ?? ''}
                label={i === 0 ? '800 × 1000 px' : undefined}
                className="absolute inset-0 w-full h-full rounded-xl"
              />
              {cat && (
                <>
                  <Overlay />
                  <div className="absolute bottom-1.5 left-1.5 z-10">
                    <span className="text-[9px] font-bold text-white uppercase truncate">{cat.name}</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-text-secondary">Cada imagen: 800 × 1000 px · vertical</p>
    </div>
  )
}

function ProductCarouselPreview({ content }: { content: unknown }) {
  const d = ProductCarouselSchema.safeParse(content)
  const title = d.success ? d.data.title : 'Carrusel de productos'
  const sourceMap: Record<string, string> = {
    new: 'Nuevos', bestseller: 'Más vendidos', featured: 'Destacados', collection: 'Colección',
  }
  const source = d.success ? sourceMap[d.data.source] ?? d.data.source : '—'
  const bgSand = d.success && d.data.bgVariant === 'sand'

  return (
    <div className={`w-full space-y-2 p-3 rounded-xl ${bgSand ? 'bg-[#F1EFEA]' : 'bg-surface-2'} border border-border`}>
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-wide truncate ${bgSand ? 'text-[#111]' : 'text-text-primary'}`}>
          {title}
        </p>
        <p className={`text-[10px] ${bgSand ? 'text-[#555]' : 'text-text-secondary'}`}>Fuente: {source}</p>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 rounded-xl overflow-hidden bg-surface border border-border">
            <div className="h-12 bg-border/30" />
            <div className="p-1.5 space-y-1">
              <div className="h-1.5 bg-border rounded w-3/4" />
              <div className="h-1.5 bg-border rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-text-secondary">Sin imágenes propias — los productos se cargan dinámicamente</p>
    </div>
  )
}

function EditorialBlockPreview({ content }: { content: unknown }) {
  const d = EditorialBlockSchema.safeParse(content)
  const variant = d.success ? d.data.variant : 'overlay'
  const imageUrl = d.success ? d.data.imageUrl : ''
  const headline = d.success ? d.data.headline : 'Titular editorial'
  const body = d.success ? d.data.body : ''

  if (variant === 'split') {
    const textLeft = d.success && d.data.imagePosition !== 'left'
    return (
      <div className="w-full flex rounded-xl overflow-hidden border border-border" style={{ height: 110 }}>
        {textLeft ? (
          <>
            <div className="flex-1 bg-surface-2 flex flex-col justify-center p-3">
              <p className="text-[9px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Editorial · Split</p>
              <p className="text-[11px] font-bold text-text-primary leading-tight truncate">{headline}</p>
              {body && <p className="text-[9px] text-text-secondary mt-1 line-clamp-2">{body}</p>}
            </div>
            <div className="relative flex-1">
              <Thumb src={imageUrl} label="800 × 1000 px" className="absolute inset-0 w-full h-full" />
            </div>
          </>
        ) : (
          <>
            <div className="relative flex-1">
              <Thumb src={imageUrl} label="800 × 1000 px" className="absolute inset-0 w-full h-full" />
            </div>
            <div className="flex-1 bg-surface-2 flex flex-col justify-center p-3">
              <p className="text-[9px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Editorial · Split</p>
              <p className="text-[11px] font-bold text-text-primary leading-tight truncate">{headline}</p>
              {body && <p className="text-[9px] text-text-secondary mt-1 line-clamp-2">{body}</p>}
            </div>
          </>
        )}
      </div>
    )
  }

  // overlay variant
  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 110 }}>
      <Thumb src={imageUrl} label="1440 × 560 px · horizontal" className="absolute inset-0 w-full h-full rounded-xl" />
      <div className="absolute inset-0 bg-black/55 rounded-xl" />
      <div className="absolute inset-0 flex flex-col justify-center p-4 z-10">
        <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wide mb-1">Editorial · Overlay</p>
        <p className="text-[12px] font-black text-white uppercase leading-tight truncate">{headline}</p>
        {body && <p className="text-[9px] text-white/70 mt-1 line-clamp-2">{body}</p>}
      </div>
    </div>
  )
}

function SplitBlockPreview({ content }: { content: unknown }) {
  const d = SplitBlockSchema.safeParse(content)
  const leftUrl = d.success ? d.data.leftImageUrl : ''
  const rightUrl = d.success ? d.data.rightImageUrl : ''
  const leftLabel = d.success ? d.data.leftLabel : 'Mujer'
  const rightLabel = d.success ? d.data.rightLabel : 'Hombre'

  return (
    <div className="w-full flex gap-2" style={{ height: 120 }}>
      <div className="relative flex-1 rounded-xl overflow-hidden">
        <Thumb src={leftUrl} label="900 × 1100 px" className="absolute inset-0 w-full h-full rounded-xl" />
        <Overlay />
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <p className="text-[11px] font-black text-white uppercase">{leftLabel}</p>
        </div>
      </div>
      <div className="relative flex-1 rounded-xl overflow-hidden">
        <Thumb src={rightUrl} label="900 × 1100 px" className="absolute inset-0 w-full h-full rounded-xl" />
        <Overlay />
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <p className="text-[11px] font-black text-white uppercase">{rightLabel}</p>
        </div>
      </div>
    </div>
  )
}

function BenefitsBlockPreview({ content }: { content: unknown }) {
  const d = BenefitsBlockSchema.safeParse(content)
  const benefits = d.success ? d.data.benefits.slice(0, 4) : []
  const ICON: Record<string, string> = {
    truck: '🚚', shield: '🔒', refresh: '↩', star: '⭐', whatsapp: '💬', 'credit-card': '💳',
  }

  return (
    <div className="w-full space-y-2">
      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Beneficios</p>
      <div className="grid grid-cols-2 gap-2">
        {benefits.length > 0
          ? benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface-2 rounded-lg p-2 border border-border">
                <span className="text-base leading-none shrink-0">{ICON[b.icon] ?? b.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-text-primary truncate">{b.title}</p>
                  <p className="text-[9px] text-text-secondary truncate">{b.description}</p>
                </div>
              </div>
            ))
          : [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 bg-surface-2 rounded-lg p-2 border border-border">
                <div className="w-5 h-5 rounded bg-border shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-1.5 bg-border rounded w-3/4" />
                  <div className="h-1.5 bg-border rounded w-1/2" />
                </div>
              </div>
            ))}
      </div>
      <p className="text-[9px] text-text-secondary">Sin imágenes — solo iconos y texto</p>
    </div>
  )
}

function NewsletterPreview({ content }: { content: unknown }) {
  const d = NewsletterSchema.safeParse(content)
  const headline = d.success ? d.data.headline : 'Únete a la comunidad SAVAYA'
  const ctaText = d.success ? d.data.ctaText : 'Suscribirme'

  return (
    <div className="w-full bg-surface-2 border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
      <p className="text-[11px] font-black uppercase text-text-primary leading-tight max-w-[260px]">{headline}</p>
      <div className="flex gap-1.5 w-full max-w-[280px]">
        <div className="flex-1 h-7 rounded-full bg-surface border border-border" />
        <div className="shrink-0 h-7 px-3 rounded-full bg-[#C9A227] flex items-center">
          <span className="text-[9px] font-bold text-black">{ctaText}</span>
        </div>
      </div>
      <p className="text-[9px] text-text-secondary">Sin imágenes — solo texto</p>
    </div>
  )
}

function PromoBannerPreview({ content }: { content: unknown }) {
  const d = PromoBannerSchema.safeParse(content)
  const headline = d.success ? d.data.headline : 'Banner Promocional'
  const subheadline = d.success ? d.data.subheadline : ''
  const ctaText = d.success ? d.data.ctaText : 'Ver más'

  return (
    <div className="w-full bg-[#C9A227] rounded-2xl p-4 flex flex-col items-center text-center gap-1.5">
      <p className="text-[12px] font-black uppercase text-black leading-tight">{headline}</p>
      {subheadline && <p className="text-[10px] text-black/70">{subheadline}</p>}
      <span className="text-[9px] font-bold px-3 py-1 rounded-full border border-black/25 text-black mt-0.5">
        {ctaText}
      </span>
      <p className="text-[9px] text-black/50 mt-1">Sin imágenes — fondo dorado fijo</p>
    </div>
  )
}

function SocialProofGridPreview({ content }: { content: unknown }) {
  const d = SocialProofGridSchema.safeParse(content)
  const images = d.success ? d.data.images : []
  const heading = d.success ? d.data.heading : 'SAVAYA EN MOVIMIENTO'

  return (
    <div className="w-full space-y-2">
      <p className="text-[11px] font-black uppercase tracking-wide text-text-primary text-center">{heading}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => {
          const img = images[i]
          return (
            <div key={i} className="aspect-square rounded-xl overflow-hidden relative bg-surface-2 border border-border">
              {img?.url ? (
                <>
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-0.5">
                    <span className="text-[8px] font-semibold text-white">800×800</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] text-text-secondary">{i + 1}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-text-secondary text-center">Cada imagen: 800 × 800 px · cuadrada</p>
    </div>
  )
}

function BannerRowPreview() {
  return (
    <div className="w-full bg-surface-2 border border-dashed border-border rounded-xl p-4 text-center">
      <p className="text-xs text-text-secondary">
        La fila de banners se gestiona en la pestaña{' '}
        <span className="font-semibold text-accent-gold">Banners</span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

type Props = {
  section: AdminSection
}

export function BlockPreview({ section }: Props) {
  return (
    <div className="px-5 py-4 border-b border-border bg-surface-2/40">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-3">
        Vista previa guardada
      </p>
      {renderPreview(section)}
    </div>
  )
}

function renderPreview(section: AdminSection) {
  switch (section.type) {
    case 'announcement_bar':
      return <AnnouncementBarPreview content={section.content} />
    case 'hero':
      return <HeroPreview content={section.content} />
    case 'shop_by_category':
      return <ShopByCategoryPreview content={section.content} />
    case 'product_carousel':
      return <ProductCarouselPreview content={section.content} />
    case 'editorial_block':
      return <EditorialBlockPreview content={section.content} />
    case 'split_block':
      return <SplitBlockPreview content={section.content} />
    case 'benefits_block':
      return <BenefitsBlockPreview content={section.content} />
    case 'newsletter':
      return <NewsletterPreview content={section.content} />
    case 'promo_banner':
      return <PromoBannerPreview content={section.content} />
    case 'social_proof_grid':
      return <SocialProofGridPreview content={section.content} />
    case 'banner_row':
      return <BannerRowPreview />
    default:
      return null
  }
}
