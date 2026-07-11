'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeroSlide {
  id: string
  eyebrow: string
  title: string
  description?: string
  cta: string
  href: string
  cta2?: string
  href2?: string
  imageUrl?: string
  mobileImageUrl?: string
  imageHref?: string
  accent?: 'gold' | 'sale'
}

// ─── Hardcoded slides (replaceable from admin in a future phase) ──────────────

// SAVAYA default slides — reemplazar con slides reales desde el admin en Supabase
const SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'Nueva Colección — Savaya 2026',
    title: 'Marca tu moda este año',
    description: 'Casuales, deportivos y de vestir — calzado femenino pensado para la mujer venezolana.',
    cta: 'Ver colección',
    href: '/nuevas-colecciones',
    cta2: 'Más vendidos',
    href2: '/mas-vendidos',
    accent: 'gold',
  },
  {
    id: 'slide-2',
    eyebrow: 'Zapatos Casuales',
    title: 'Comodidad que no renuncia al estilo',
    description: 'Para el día a día. Modelos versátiles que van con todo — livianos, frescos y con estilo.',
    cta: 'Ver casuales',
    href: '/casuales',
    cta2: 'Ver deportivos',
    href2: '/deportivos',
    accent: 'gold',
  },
  {
    id: 'slide-3',
    eyebrow: 'Descuentos de Temporada',
    title: 'Hasta 40% de descuento',
    description: 'Modelos seleccionados con precios increíbles. Solo por tiempo limitado.',
    cta: 'Ver descuentos',
    href: '/descuentos',
    cta2: 'Ver de vestir',
    href2: '/de-vestir',
    accent: 'sale',
  },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 4 7 10 13 16" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 4 13 10 7 16" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="8" x2="13" y2="8" />
      <polyline points="9 4 13 8 9 12" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HeroBannerProps {
  slides?: HeroSlide[]
  autoPlayInterval?: number
}

export default function HeroBanner({ slides = SLIDES, autoPlayInterval = 5500 }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)

  const goTo = useCallback((index: number) => {
    setCurrent(index)
    setAnimKey((k) => k + 1)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % slides.length)
  }, [current, slides.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length)
  }, [current, slides.length, goTo])

  useEffect(() => {
    if (paused || slides.length <= 1) return
    timerRef.current = setInterval(next, autoPlayInterval)
    return () => clearInterval(timerRef.current!)
  }, [next, paused, autoPlayInterval, slides.length])

  if (!slides.length) return null

  const slide = slides[current]
  const isPrimary = (slide.accent === 'sale')
  const isImageOnly = !slide.title && !slide.cta && !!slide.imageHref

  return (
    <section
      className="relative overflow-hidden bg-accent h-[80vh] md:h-auto md:aspect-[1920/900] md:max-h-[900px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Banner principal"
    >
      {/* ── Background images (all preloaded, only active visible) ─── */}
      {slides.map((s, i) => {
        const slideImageOnly = !s.title && !s.cta && !!s.imageHref
        return (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === current ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={i !== current}
          >
            {/* Desktop image */}
            {s.imageUrl && (
              <Image
                src={s.imageUrl}
                alt={s.title || 'Slide'}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-center hidden md:block"
              />
            )}
            {/* Mobile image — falls back to desktop image if no mobile image set */}
            {(s.mobileImageUrl || s.imageUrl) && (
              <Image
                src={s.mobileImageUrl || s.imageUrl!}
                alt={s.title || 'Slide'}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-top md:hidden"
              />
            )}
            {!slideImageOnly && (
              <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-accent/55 to-accent/80 md:bg-gradient-to-r md:from-accent/80 md:via-accent/50 md:to-accent/10" />
            )}
            {!slideImageOnly && (
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-accent/35 to-transparent" />
            )}
          </div>
        )
      })}

      {/* ── Image-only clickable overlay ──────────────────────────── */}
      {isImageOnly && slide.imageHref && (
        <Link
          href={slide.imageHref}
          className="absolute inset-0 z-10"
          aria-label="Ver más"
        />
      )}

      {/* ── Slide content ─────────────────────────────────────────── */}
      {!isImageOnly && (
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-0">
            {slide.eyebrow && (
              <p
                key={`eyebrow-${animKey}`}
                className={cn(
                  'font-heading text-[11px] md:text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 animate-fade-in-up',
                  isPrimary ? 'text-sale' : 'text-gold',
                )}
              >
                {slide.eyebrow}
              </p>
            )}

            {slide.title && (
              <h1
                key={`title-${animKey}`}
                className="font-display text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] max-w-2xl mb-4 md:mb-6 animate-fade-in-up-delay"
              >
                {slide.title}
              </h1>
            )}

            {slide.description && (
              <p
                key={`desc-${animKey}`}
                className="text-white/65 text-sm md:text-base max-w-md mb-8 md:mb-10 leading-relaxed animate-fade-in-up-delay hidden sm:block"
              >
                {slide.description}
              </p>
            )}

            {(slide.cta || slide.cta2) && (
              <div
                key={`cta-${animKey}`}
                className="flex flex-wrap items-center gap-3 animate-fade-in-up-delay-2"
              >
                {/* Primary CTA */}
                {slide.cta && slide.href && (
                  <Link
                    href={slide.href}
                    className={cn(
                      'inline-flex items-center gap-2.5 font-heading font-bold text-sm px-6 md:px-8 py-3 md:py-4 rounded tracking-wide transition-all duration-200',
                      isPrimary
                        ? 'bg-sale text-white hover:bg-red-700'
                        : 'bg-white text-accent hover:bg-gold hover:text-white',
                    )}
                  >
                    {slide.cta}
                    <IconChevronRight />
                  </Link>
                )}

                {/* Secondary CTA */}
                {slide.cta2 && slide.href2 && (
                  <Link
                    href={slide.href2}
                    className="inline-flex items-center gap-2 font-heading font-semibold text-sm px-6 md:px-8 py-3 md:py-4 rounded tracking-wide border border-white/35 text-white hover:border-white hover:bg-white/10 transition-all duration-200"
                  >
                    {slide.cta2}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────────── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <IconArrowLeft />
          </button>
          <button
            onClick={next}
            aria-label="Siguiente slide"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <IconArrowRight />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === current}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === current ? 'w-7 h-2 bg-white' : 'w-2 h-2 bg-white/35 hover:bg-white/60',
                )}
              />
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <div className="absolute bottom-0 left-0 right-0 z-20 h-px bg-white/10">
              <div
                key={`${current}-${animKey}`}
                className="h-full bg-gold"
                style={{ animation: `slideProgress ${autoPlayInterval}ms linear forwards` }}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}
