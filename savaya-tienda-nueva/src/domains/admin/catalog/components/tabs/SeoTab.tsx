'use client'

import { Input } from '@/shared/ui/Input'

export type SeoTabState = {
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  metaImageUrl: string
  publishedAt: string
  publishMode: 'published' | 'draft' | 'scheduled'
}

type Props = {
  state: SeoTabState
  productName: string
  onChange: (patch: Partial<SeoTabState>) => void
}

function getModeFromPublishedAt(publishedAt: string | null): SeoTabState['publishMode'] {
  if (!publishedAt) return 'draft'
  const d = new Date(publishedAt)
  if (d <= new Date()) return 'published'
  return 'scheduled'
}

export { getModeFromPublishedAt }

export function SeoTab({ state, productName, onChange }: Props) {
  const titleCount = state.seoTitle.length
  const descCount = state.seoDescription.length

  function handleModeChange(mode: SeoTabState['publishMode']) {
    if (mode === 'published') {
      onChange({ publishMode: 'published', publishedAt: new Date().toISOString() })
    } else if (mode === 'draft') {
      onChange({ publishMode: 'draft', publishedAt: '' })
    } else {
      onChange({ publishMode: 'scheduled', publishedAt: '' })
    }
  }

  return (
    <div className="space-y-6 py-2">
      {/* Publication status */}
      <div className="bg-surface-2 rounded-xl p-4 space-y-3">
        <p className="font-sans text-sm font-medium text-text-primary">Estado de publicación</p>
        <div className="flex flex-wrap gap-3">
          {(['published', 'draft', 'scheduled'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              className={`px-4 py-2 rounded-full text-sm font-sans border transition-colors duration-150 ${
                state.publishMode === mode
                  ? 'bg-accent-gold text-text-primary-inverse border-accent-gold'
                  : 'border-border bg-surface text-text-primary hover:border-border-hover'
              }`}
            >
              {mode === 'published' ? 'Publicado' : mode === 'draft' ? 'Borrador' : 'Programar'}
            </button>
          ))}
        </div>

        {state.publishMode === 'scheduled' && (
          <div>
            <label className="font-sans text-sm font-medium text-text-primary block mb-1.5">
              Publicar el
            </label>
            <input
              type="datetime-local"
              value={state.publishedAt ? state.publishedAt.slice(0, 16) : ''}
              onChange={(e) => onChange({ publishedAt: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              className="h-11 rounded-sm border border-border bg-surface px-4 font-sans text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
            />
          </div>
        )}

        {state.publishMode === 'published' && (
          <p className="font-sans text-sm text-text-secondary">
            El producto es visible en la tienda inmediatamente.
          </p>
        )}
        {state.publishMode === 'draft' && (
          <p className="font-sans text-sm text-text-secondary">
            El producto no es visible en la tienda hasta que lo publiques.
          </p>
        )}
      </div>

      {/* SEO Preview */}
      <div className="border border-border rounded-xl p-4 space-y-1">
        <p className="font-sans text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Vista previa en Google</p>
        <p className="font-sans text-base text-blue-700 font-medium leading-snug">
          {state.seoTitle || productName || 'Título del producto — SAVAYA'}
        </p>
        <p className="font-sans text-sm text-text-secondary leading-relaxed">
          {state.seoDescription || 'Meta descripción del producto. Aparece en los resultados de búsqueda.'}
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <Input
            label="SEO Title"
            value={state.seoTitle}
            onChange={(e) => onChange({ seoTitle: e.target.value })}
            hint={`${titleCount}/70 caracteres`}
            maxLength={70}
            placeholder={`${productName || 'Nombre del producto'} — SAVAYA`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-sm font-medium text-text-primary">Meta descripción</label>
          <textarea
            value={state.seoDescription}
            onChange={(e) => onChange({ seoDescription: e.target.value })}
            maxLength={160}
            rows={3}
            placeholder="Descripción que aparece en Google (máx. 160 caracteres)"
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-sans text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1 resize-none"
          />
          <p className="font-sans text-xs text-text-secondary">{descCount}/160 caracteres</p>
        </div>

        <Input
          label="Keywords"
          value={state.seoKeywords}
          onChange={(e) => onChange({ seoKeywords: e.target.value })}
          hint="Separados por coma. Referencia interna — no afecta el ranking directamente."
          placeholder="sandalia, calzado, zapatos"
        />

        <Input
          label="OG Image URL"
          type="url"
          value={state.metaImageUrl}
          onChange={(e) => onChange({ metaImageUrl: e.target.value })}
          hint="URL de imagen para compartir en redes sociales (1200×630 px recomendado)"
          placeholder="https://res.cloudinary.com/..."
        />
      </div>
    </div>
  )
}
