import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ComponentsShowcase } from './ComponentsShowcase'

export const metadata: Metadata = {
  title: 'Design System',
}

// ─── Datos de tokens para renderizar ───────────────────────────────────────

interface ColorSwatch {
  name: string
  token: string
  hex: string
  textClass: string
  border?: boolean
}

const colorSwatches: ColorSwatch[] = [
  { name: 'brand-black', token: '--color-brand-black', hex: '#0A0A0A', textClass: 'text-brand-white' },
  { name: 'brand-offwhite', token: '--color-brand-offwhite', hex: '#F7F5F0', textClass: 'text-text-primary' },
  { name: 'brand-white', token: '--color-brand-white', hex: '#FFFFFF', textClass: 'text-text-primary', border: true },
  { name: 'accent-gold', token: '--color-accent-gold', hex: '#C9A227', textClass: 'text-brand-black' },
  { name: 'accent-gold-soft', token: '--color-accent-gold-soft', hex: '#E8D9A8', textClass: 'text-text-primary' },
  { name: 'text-primary', token: '--color-text-primary', hex: '#0A0A0A', textClass: 'text-brand-white' },
  { name: 'text-secondary', token: '--color-text-secondary', hex: '#6B6B6B', textClass: 'text-brand-white' },
  { name: 'border', token: '--color-border', hex: '#E5E2DC', textClass: 'text-text-primary' },
  { name: 'surface', token: '--color-surface', hex: '#FFFFFF', textClass: 'text-text-primary', border: true },
  { name: 'success', token: '--color-success', hex: '#1E7F4F', textClass: 'text-brand-white' },
  { name: 'warning', token: '--color-warning', hex: '#B8791A', textClass: 'text-brand-white' },
  { name: 'error', token: '--color-error', hex: '#C0362C', textClass: 'text-brand-white' },
]

const radiusSamples = [
  { name: 'sm', label: 'radius-sm', value: '8px', twClass: 'rounded-sm' },
  { name: 'md', label: 'radius-md', value: '14px', twClass: 'rounded-md' },
  { name: 'lg', label: 'radius-lg', value: '24px', twClass: 'rounded-lg' },
  { name: 'xl', label: 'radius-xl', value: '32px', twClass: 'rounded-xl' },
  { name: 'pill', label: 'radius-pill', value: '9999px', twClass: 'rounded-pill' },
]

const shadowSamples = [
  { label: 'shadow-sm', twClass: 'shadow-sm' },
  { label: 'shadow-md', twClass: 'shadow-md' },
  { label: 'shadow-lg', twClass: 'shadow-lg' },
]

const spacingScale: Array<{ token: string; px: number; twWidth: string }> = [
  { token: 'spacing-1', px: 4, twWidth: 'w-1' },
  { token: 'spacing-2', px: 8, twWidth: 'w-2' },
  { token: 'spacing-3', px: 12, twWidth: 'w-3' },
  { token: 'spacing-4', px: 16, twWidth: 'w-4' },
  { token: 'spacing-6', px: 24, twWidth: 'w-6' },
  { token: 'spacing-8', px: 32, twWidth: 'w-8' },
  { token: 'spacing-12', px: 48, twWidth: 'w-12' },
  { token: 'spacing-16', px: 64, twWidth: 'w-16' },
  { token: 'spacing-24', px: 96, twWidth: 'w-24' },
]

const stateBadges = [
  { label: 'success', text: 'Pago aprobado', bgClass: 'bg-success', textClass: 'text-brand-white' },
  { label: 'warning', text: 'Stock bajo', bgClass: 'bg-warning', textClass: 'text-brand-white' },
  { label: 'error', text: 'Sin stock', bgClass: 'bg-error', textClass: 'text-brand-white' },
]

// ─── Componente ────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== 'development') notFound()

  return (
    <div className="min-h-screen bg-brand-offwhite text-text-primary">
      {/* Header */}
      <header className="bg-brand-black text-brand-white px-8 py-6 mb-12">
        <p className="font-sans text-text-secondary text-sm tracking-widest uppercase mb-1">
          Solo en desarrollo
        </p>
        <h1 className="font-display text-4xl font-bold tracking-wider">
          SAVAYA — Design System
        </h1>
        <p className="font-sans text-text-secondary text-sm mt-2">
          Tokens de marca · Fase 2.1 | Componentes atómicos · Fase 2.2
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-8 pb-24 space-y-16">

        {/* ── Colores ─────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Colores</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {colorSwatches.map((swatch) => (
              <div
                key={swatch.name}
                className={`rounded-lg overflow-hidden border ${swatch.border ? 'border-border' : 'border-transparent'} shadow-sm`}
              >
                <div
                  className="h-20 w-full"
                  style={{ backgroundColor: swatch.hex }}
                  aria-hidden="true"
                />
                <div className="bg-surface px-3 py-2">
                  <p className="font-sans text-xs font-semibold text-text-primary truncate">
                    {swatch.name}
                  </p>
                  <p className="font-sans text-xs text-text-secondary font-mono">
                    {swatch.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tipografía ──────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Tipografía</SectionTitle>
          <div className="bg-surface rounded-lg p-8 shadow-sm space-y-8 border border-border">
            <TypeRow label="Archivo 500 — Display">
              <p className="font-display font-medium text-4xl text-text-primary tracking-tight">
                SAVAYA — Marca tu moda
              </p>
            </TypeRow>
            <Divider />
            <TypeRow label="Archivo 700 — Display Bold">
              <p className="font-display font-bold text-4xl text-text-primary tracking-tight">
                Nuevos Arrivals
              </p>
            </TypeRow>
            <Divider />
            <TypeRow label="Inter 400 — Body">
              <p className="font-sans font-normal text-base text-text-primary">
                Texto de cuerpo: descubre nuestra colección de calzado femenino
              </p>
            </TypeRow>
            <Divider />
            <TypeRow label="Inter 500 — Subtítulo">
              <p className="font-sans font-medium text-base text-text-primary">
                Subtítulo: tallas 35 al 40, envíos a todo Venezuela
              </p>
            </TypeRow>
            <Divider />
            <TypeRow label="Inter 600 — Precio">
              <p className="font-sans font-semibold text-2xl text-text-primary">
                $45.00 USD
              </p>
            </TypeRow>
          </div>
        </section>

        {/* ── Border Radius ───────────────────────────────────────────── */}
        <section>
          <SectionTitle>Border Radius</SectionTitle>
          <div className="flex flex-wrap gap-6 items-end">
            {radiusSamples.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div
                  className={`bg-brand-black w-20 h-20 ${r.twClass}`}
                  aria-hidden="true"
                />
                <p className="font-sans text-xs font-semibold text-text-primary">
                  {r.label}
                </p>
                <p className="font-sans text-xs text-text-secondary font-mono">
                  {r.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sombras ─────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Sombras</SectionTitle>
          <div className="flex flex-wrap gap-8">
            {shadowSamples.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-3">
                <div
                  className={`bg-surface rounded-lg w-40 h-24 ${s.twClass} border border-border flex items-center justify-center`}
                >
                  <span className="font-sans text-xs text-text-secondary">
                    {s.label}
                  </span>
                </div>
                <p className="font-sans text-xs font-semibold text-text-primary">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Spacing ─────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Spacing — Escala 4px</SectionTitle>
          <div className="bg-surface rounded-lg p-8 shadow-sm border border-border space-y-3">
            {spacingScale.map((s) => (
              <div key={s.token} className="flex items-center gap-4">
                <span className="font-sans font-mono text-xs text-text-secondary w-24 shrink-0">
                  {s.token}
                </span>
                <span className="font-sans font-mono text-xs text-text-secondary w-8 shrink-0">
                  {s.px}px
                </span>
                <div
                  className="bg-accent-gold h-4 rounded-pill"
                  style={{ width: `${s.px}px` }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Estados ─────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Estados</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {stateBadges.map((badge) => (
              <span
                key={badge.label}
                className={`inline-flex items-center px-4 py-2 rounded-pill text-sm font-medium ${badge.bgClass} ${badge.textClass}`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        </section>

        {/* ── Componentes atómicos (client) ───────────────────────────── */}
        <ComponentsShowcase />

      </main>
    </div>
  )
}

// ─── Sub-componentes locales (no se exportan) ──────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-medium text-2xl text-text-primary mb-6 pb-2 border-b border-border">
      {children}
    </h2>
  )
}

function TypeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-sans text-xs font-medium text-text-secondary tracking-wider uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

function Divider() {
  return <hr className="border-border" />
}
