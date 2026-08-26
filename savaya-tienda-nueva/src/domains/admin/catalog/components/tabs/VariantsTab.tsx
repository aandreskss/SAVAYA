'use client'

import { useState } from 'react'
import { Toggle } from '@/shared/ui/Toggle'
import type { ColorOption, SizeOption } from '../../types'

export type VariantRow = {
  id?: string
  colorId: string
  colorName: string
  colorHex: string
  sizeId: string
  sizeName: string
  sku: string
  price: string
  compareAtPrice: string
  isActive: boolean
  initialStock: number
}

type Props = {
  variants: VariantRow[]
  colors: ColorOption[]
  sizes: SizeOption[]
  basePrice: string
  productName: string
  onChange: (variants: VariantRow[]) => void
}

function generateSku(productName: string, colorName: string, sizeName: string): string {
  const prodAbbrev = productName
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((w) =>
      w
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .charAt(0)
        .toUpperCase(),
    )
    .join('')

  const colorAbbrev = colorName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .slice(0, 3)

  return `${prodAbbrev || 'PRD'}-${colorAbbrev || 'CLR'}-${sizeName}`
}

// Derive the initial selected sets from existing active variants
function initSelected(variants: VariantRow[]) {
  const colorIds = new Set<string>()
  const sizeIds = new Set<string>()
  for (const v of variants) {
    if (v.isActive !== false) {
      colorIds.add(v.colorId)
      sizeIds.add(v.sizeId)
    }
  }
  return { colorIds, sizeIds }
}

export function VariantsTab({
  variants,
  colors,
  sizes,
  basePrice,
  productName,
  onChange,
}: Props) {
  // Selected color/size IDs are tracked independently from variant rows.
  // This fixes the catch-22 where the user had to select both a color AND
  // a size at the same time for anything to happen.
  const [selColors, setSelColors] = useState<Set<string>>(
    () => initSelected(variants).colorIds,
  )
  const [selSizes, setSelSizes] = useState<Set<string>>(
    () => initSelected(variants).sizeIds,
  )

  // Reconcile the cross-product of (newColors × newSizes) with existing variant rows.
  // - Re-uses existing variant data (sku, price, etc.) when a combination already exists.
  // - Creates new variant rows for new combinations.
  // - Soft-deletes (isActive=false) saved variants whose color/size was deselected.
  function reconcile(newColors: Set<string>, newSizes: Set<string>) {
    const next: VariantRow[] = []

    // Active combinations in the new cross-product
    for (const colorId of newColors) {
      const color = colors.find((c) => c.id === colorId)
      if (!color) continue
      for (const sizeId of newSizes) {
        const size = sizes.find((s) => s.id === sizeId)
        if (!size) continue
        const existing = variants.find((v) => v.colorId === colorId && v.sizeId === sizeId)
        if (existing) {
          next.push({ ...existing, isActive: true })
        } else {
          // Derive SKU prefix from a sibling variant of the same color (preserving user edits).
          // Sibling SKU format is expected to be "PREFIX-SIZE", so strip the last dash-segment.
          const sibling = variants.find((v) => v.colorId === colorId)
          let sku: string
          if (sibling) {
            const lastDash = sibling.sku.lastIndexOf('-')
            const prefix = lastDash > 0 ? sibling.sku.slice(0, lastDash) : sibling.sku
            sku = `${prefix}-${size.name}`
          } else {
            sku = generateSku(productName, color.name, size.name)
          }
          next.push({
            colorId,
            colorName: color.name,
            colorHex: color.hex ?? '#888',
            sizeId,
            sizeName: size.name,
            sku,
            price: basePrice || '0',
            compareAtPrice: '',
            isActive: true,
            initialStock: 0,
          })
        }
      }
    }

    // Preserve saved variants that fell outside the new cross-product as soft-deleted
    for (const v of variants) {
      const inCrossProduct = newColors.has(v.colorId) && newSizes.has(v.sizeId)
      if (!inCrossProduct && v.id) {
        next.push({ ...v, isActive: false })
      }
    }

    onChange(next)
  }

  function toggleColor(colorId: string) {
    const next = new Set(selColors)
    if (next.has(colorId)) next.delete(colorId)
    else next.add(colorId)
    setSelColors(next)
    reconcile(next, selSizes)
  }

  function toggleSize(sizeId: string) {
    const next = new Set(selSizes)
    if (next.has(sizeId)) next.delete(sizeId)
    else next.add(sizeId)
    setSelSizes(next)
    reconcile(selColors, next)
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  const activeVariants = variants.filter((v) => v.isActive !== false)
  const hasSelections = selColors.size > 0 || selSizes.size > 0

  return (
    <div className="space-y-6 py-2">
      {/* Color selector */}
      <div>
        <p className="font-sans text-sm font-medium text-text-primary mb-2">Colores</p>
        {colors.length === 0 ? (
          <p className="text-xs text-text-secondary">No hay colores configurados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const selected = selColors.has(color.id)
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => toggleColor(color.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-sans border transition-colors duration-150 ${
                    selected
                      ? 'border-accent-gold bg-accent-gold text-text-primary-inverse'
                      : 'border-border bg-surface text-text-primary hover:border-border-hover'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: color.hex ?? '#888' }}
                    aria-hidden="true"
                  />
                  {color.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Size selector */}
      <div>
        <p className="font-sans text-sm font-medium text-text-primary mb-2">Tallas</p>
        {sizes.length === 0 ? (
          <p className="text-xs text-text-secondary">No hay tallas configuradas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const selected = selSizes.has(size.id)
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => toggleSize(size.id)}
                  className={`min-w-[2.5rem] px-3 py-1.5 rounded-full text-sm font-sans border transition-colors duration-150 ${
                    selected
                      ? 'border-accent-gold bg-accent-gold text-text-primary-inverse'
                      : 'border-border bg-surface text-text-primary hover:border-border-hover'
                  }`}
                >
                  {size.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Helper hint */}
      {hasSelections && selColors.size > 0 && selSizes.size === 0 && (
        <p className="text-xs text-text-secondary">
          Selecciona al menos una talla para generar variantes.
        </p>
      )}
      {hasSelections && selSizes.size > 0 && selColors.size === 0 && (
        <p className="text-xs text-text-secondary">
          Selecciona al menos un color para generar variantes.
        </p>
      )}

      {/* Variants table */}
      {activeVariants.length > 0 ? (
        <div>
          <p className="font-sans text-sm font-medium text-text-primary mb-2">
            Variantes ({activeVariants.length})
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-3 py-2.5 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Color</th>
                  <th className="px-3 py-2.5 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Talla</th>
                  <th className="px-3 py-2.5 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">SKU</th>
                  <th className="px-3 py-2.5 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Precio</th>
                  <th className="px-3 py-2.5 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">P. tachado</th>
                  {activeVariants.some((v) => !v.id) && (
                    <th className="px-3 py-2.5 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Stock inicial</th>
                  )}
                  <th className="px-3 py-2.5 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Activa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {variants.map((v, index) => {
                  if (v.id && v.isActive === false) return null
                  if (!v.id && v.isActive === false) return null

                  return (
                    <tr key={index} className="hover:bg-surface-2/40 transition-colors">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 rounded-full border border-border shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                            aria-hidden="true"
                          />
                          <span className="font-sans text-sm">{v.colorName}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-sans text-sm">{v.sizeName}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariant(index, { sku: e.target.value.toUpperCase() })}
                          className="w-28 px-2 py-1 text-xs border border-border rounded font-mono bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariant(index, { price: e.target.value })}
                          min="0"
                          step="0.01"
                          className="w-20 px-2 py-1 text-xs border border-border rounded font-sans bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.compareAtPrice}
                          onChange={(e) => updateVariant(index, { compareAtPrice: e.target.value })}
                          min="0"
                          step="0.01"
                          placeholder="—"
                          className="w-20 px-2 py-1 text-xs border border-border rounded font-sans bg-surface text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold"
                        />
                      </td>
                      {!v.id && (
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={v.initialStock}
                            onChange={(e) => updateVariant(index, { initialStock: parseInt(e.target.value) || 0 })}
                            min="0"
                            className="w-16 px-2 py-1 text-xs border border-border rounded font-sans bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <Toggle
                          size="sm"
                          checked={v.isActive}
                          onChange={(checked) => updateVariant(index, { isActive: checked })}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-xl p-6 text-center">
          <p className="font-sans text-sm text-text-secondary">
            Selecciona colores y tallas para generar variantes automáticamente.
          </p>
        </div>
      )}
    </div>
  )
}
