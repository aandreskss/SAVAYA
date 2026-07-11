'use client'

import ImageUploader from './ImageUploader'

interface ColorEntry {
  name: string
  hex: string
}

interface ColorImagesManagerProps {
  colors: ColorEntry[]
  colorImages: Record<string, string[]>
  onChange: (colorImages: Record<string, string[]>) => void
}

export default function ColorImagesManager({ colors, colorImages, onChange }: ColorImagesManagerProps) {
  if (colors.length === 0) {
    return (
      <p className="text-sm text-gray-text font-body text-center py-6">
        Agrega variantes con colores primero para asignar fotos por color.
      </p>
    )
  }

  function handleChange(color: string, images: string[]) {
    onChange({ ...colorImages, [color]: images })
  }

  return (
    <div className="space-y-4">
      {colors.map((color) => {
        const imgs = colorImages[color.name] ?? []
        return (
          <div key={color.name} className="border border-gray-light rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-4 h-4 rounded-full border border-gray-light shrink-0"
                style={(() => {
                  const [h1, h2] = color.hex.split('|')
                  return h2
                    ? { background: `linear-gradient(135deg, ${h1} 50%, ${h2} 50%)` }
                    : { backgroundColor: h1 }
                })()}
              />
              <span className="text-sm font-heading font-semibold">{color.name}</span>
              {imgs.length === 0 && (
                <span className="text-[11px] text-gray-text ml-1">(usará imágenes generales)</span>
              )}
            </div>
            <ImageUploader
              images={imgs}
              onChange={(newImgs) => handleChange(color.name, newImgs)}
              maxImages={6}
            />
          </div>
        )
      })}
    </div>
  )
}
