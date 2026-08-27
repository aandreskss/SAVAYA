'use client'

import { useState } from 'react'
import { ColorSelector } from '@/shared/ui'
import { SizeSelector } from '@/shared/ui'
import type { ProductDetail } from '@/domains/catalog/repository'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductVariantSelectorProps = {
  variants: ProductDetail['variants']
  selectedVariantId?: string
  onVariantChange: (variantId: string) => void
}

// ---------------------------------------------------------------------------
// getUniqueColors — helper, stable across renders
// ---------------------------------------------------------------------------

function getUniqueColors(
  variants: ProductDetail['variants'],
): { id: string; name: string; hex: string }[] {
  return variants.reduce<{ id: string; name: string; hex: string }[]>((acc, v) => {
    if (!acc.find((c) => c.id === v.color.id)) {
      acc.push(v.color)
    }
    return acc
  }, [])
}

// ---------------------------------------------------------------------------
// ProductVariantSelector
// ---------------------------------------------------------------------------

export function ProductVariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
}: ProductVariantSelectorProps) {
  // Inactive variants are hidden from the storefront entirely.
  // Active variants with no stock are shown with a diagonal line (isAvailable: false).
  const activeVariants = variants.filter((v) => v.isActive)

  // Derive the selected color from the current variantId
  const selectedVariant = variants.find((v) => v.id === selectedVariantId)

  // Extract unique colors from ACTIVE variants only
  const uniqueColors = getUniqueColors(activeVariants)

  // Auto-select color when there is only one — computed at init time, no effect needed
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>(
    selectedVariant?.color.id ?? (uniqueColors.length === 1 ? uniqueColors[0].id : undefined),
  )
  const [selectedSizeId, setSelectedSizeId] = useState<string | undefined>(
    selectedVariant?.size.id,
  )

  // When color changes, clear size selection if the current size is not available for new color
  function handleColorChange(colorId: string) {
    setSelectedColorId(colorId)

    const sizesForColor = activeVariants
      .filter((v) => v.color.id === colorId)
      .map((v) => v.size.id)

    // If current size is not available for the new color, clear it
    if (selectedSizeId && !sizesForColor.includes(selectedSizeId)) {
      setSelectedSizeId(undefined)
    } else if (selectedSizeId) {
      // Try to find a matching variant with new color + same size
      const matchingVariant = activeVariants.find(
        (v) => v.color.id === colorId && v.size.id === selectedSizeId,
      )
      if (matchingVariant) {
        onVariantChange(matchingVariant.id)
      }
    }
  }

  function handleSizeChange(sizeId: string) {
    setSelectedSizeId(sizeId)

    if (!selectedColorId) return

    const matchingVariant = activeVariants.find(
      (v) => v.color.id === selectedColorId && v.size.id === sizeId,
    )
    if (matchingVariant) {
      onVariantChange(matchingVariant.id)
    }
  }

  // A color is shown if it has at least one active variant.
  // isAvailable = has at least one active variant with stock (no diagonal line).
  const colorOptions = uniqueColors.map((color) => ({
    id: color.id,
    name: color.name,
    hex: color.hex,
    isAvailable: activeVariants.some((v) => v.color.id === color.id && v.isAvailable),
  }))

  // Size options for the selected color — active variants only, isAvailable = has stock.
  const sizeOptionsForColor = (() => {
    if (!selectedColorId) return []

    const sizesForColor = activeVariants
      .filter((v) => v.color.id === selectedColorId)
      .map((v) => ({
        id: v.size.id,
        name: v.size.name,
        isAvailable: v.isAvailable,
      }))

    // Deduplicate by size id
    return sizesForColor.reduce<{ id: string; name: string; isAvailable: boolean }[]>(
      (acc, s) => {
        if (!acc.find((existing) => existing.id === s.id)) {
          acc.push(s)
        }
        return acc
      },
      [],
    )
  })()

  return (
    <div className="flex flex-col gap-5">
      <ColorSelector
        colors={colorOptions}
        selectedColorId={selectedColorId}
        onChange={handleColorChange}
        label="Color"
      />

      {selectedColorId && sizeOptionsForColor.length > 0 && (
        <SizeSelector
          sizes={sizeOptionsForColor}
          selectedSizeId={selectedSizeId}
          onChange={handleSizeChange}
          label="Talla"
        />
      )}
    </div>
  )
}
