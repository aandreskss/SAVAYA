'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { updateCategoryImage } from './actions'
import { cloudinaryCoverLoader } from '@/lib/cloudinary'

interface TopCategory {
  id: string
  name: string
  slug: string
  image_url: string | null
  order: number
}

export default function CategoryImagesManager({ categories }: { categories: TopCategory[] }) {
  const [localCats, setLocalCats] = useState(categories)
  const [uploading, setUploading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeId) return

    const catId = activeId
    setUploading(catId)
    setErrors((prev) => ({ ...prev, [catId]: '' }))
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'savaya/categorias')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Error al subir imagen')
      }
      const { url } = (await res.json()) as { url: string }

      startTransition(async () => {
        const result = await updateCategoryImage(catId, url)
        if ('error' in result) {
          setErrors((prev) => ({ ...prev, [catId]: result.error }))
        } else {
          setLocalCats((prev) => prev.map((c) => (c.id === catId ? { ...c, image_url: url } : c)))
          setSuccess(`Imagen de ${localCats.find((c) => c.id === catId)?.name} actualizada`)
          setTimeout(() => setSuccess(null), 3000)
        }
      })
    } catch (err) {
      setErrors((prev) => ({ ...prev, [catId]: (err as Error).message || 'Error al subir imagen' }))
    } finally {
      setUploading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function openPicker(catId: string) {
    setActiveId(catId)
    // Needs a tick so activeId is set before onChange fires
    setTimeout(() => fileInputRef.current?.click(), 0)
  }

  if (categories.length === 0) {
    return (
      <div className="p-6 border border-dashed border-gray-light rounded-lg text-center text-gray-text text-sm">
        No hay categorías principales. Ejecuta la migración SQL para crearlas.
      </div>
    )
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {success && (
        <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-body">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {localCats.map((cat) => (
          <div key={cat.id} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => openPicker(cat.id)}
              disabled={!!uploading}
              className="relative aspect-[3/4] rounded overflow-hidden bg-gray-bg group border border-gray-light hover:border-black transition-colors disabled:cursor-wait"
              title={`Cambiar imagen de ${cat.name}`}
            >
              {cat.image_url ? (
                <Image
                  loader={cloudinaryCoverLoader}
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-text">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-[10px] font-body">Sin imagen</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white text-xs font-heading font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Cambiar imagen
                </span>
              </div>

              {/* Upload spinner */}
              {uploading === cat.id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            <p className="text-xs font-heading font-semibold text-center text-black">
              {cat.name}
            </p>

            {errors[cat.id] && (
              <p className="text-[11px] text-sale text-center font-body">{errors[cat.id]}</p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-text font-body">
        Haz clic en una categoría para cambiar su imagen. Se recomienda formato 3:4 (600×800 px).
      </p>
    </div>
  )
}
