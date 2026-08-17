'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/shared/lib/utils'
import { deleteProductMediaAction } from '../../actions'
import { toast } from '@/shared/ui'

export type MediaItem = {
  id?: string
  cloudinaryPublicId: string
  url: string
  altText: string
  isPrimary: boolean
  sortOrder: number
}

type Props = {
  productId?: string
  media: MediaItem[]
  onChange: (media: MediaItem[]) => void
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function MediaTab({ productId, media, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        const sigRes = await fetch('/api/admin/catalog/upload-signature')
        if (!sigRes.ok) throw new Error('Error al obtener firma de Cloudinary')
        const sig = await sigRes.json()

        if (sig.isDev) {
          // Dev mode: add a placeholder
          onChange([
            ...media,
            {
              cloudinaryPublicId: `dev/${Date.now()}`,
              url: URL.createObjectURL(file),
              altText: '',
              isPrimary: media.length === 0,
              sortOrder: media.length,
            },
          ])
          continue
        }

        const fd = new FormData()
        fd.append('file', file)
        fd.append('api_key', sig.apiKey)
        fd.append('timestamp', String(sig.timestamp))
        fd.append('signature', sig.signature)
        fd.append('folder', sig.folder)
        fd.append('public_id', sig.publicId)

        const cdRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: 'POST', body: fd },
        )
        if (!cdRes.ok) throw new Error('Error al subir imagen a Cloudinary')
        const cd = await cdRes.json()

        onChange([
          ...media,
          {
            cloudinaryPublicId: cd.public_id,
            url: cd.secure_url,
            altText: '',
            isPrimary: media.length === 0,
            sortOrder: media.length,
          },
        ])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(item: MediaItem, index: number) {
    if (item.id && productId) {
      setDeletingId(item.id)
      const result = await deleteProductMediaAction(item.id)
      setDeletingId(null)
      if (!result.success) {
        toast.error(result.error)
        return
      }
    }
    const next = media.filter((_, i) => i !== index).map((m, i) => ({ ...m, sortOrder: i }))
    if (next.length > 0 && !next.some((m) => m.isPrimary)) {
      next[0].isPrimary = true
    }
    onChange(next)
  }

  function handleSetPrimary(index: number) {
    onChange(media.map((m, i) => ({ ...m, isPrimary: i === index })))
  }

  function handleAltChange(index: number, altText: string) {
    onChange(media.map((m, i) => (i === index ? { ...m, altText } : m)))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...media]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next.map((m, i) => ({ ...m, sortOrder: i })))
  }

  function moveDown(index: number) {
    if (index === media.length - 1) return
    const next = [...media]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next.map((m, i) => ({ ...m, sortOrder: i })))
  }

  return (
    <div className="space-y-4 py-2">
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileSelect}
          aria-label="Subir imágenes"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-sm border border-dashed border-border',
            'font-sans text-sm text-text-secondary hover:border-border-hover hover:text-text-primary',
            'transition-colors duration-150',
            uploading && 'opacity-50 cursor-not-allowed',
          )}
        >
          <UploadIcon />
          {uploading ? 'Subiendo...' : 'Subir imágenes'}
        </button>
        <p className="mt-1.5 font-sans text-xs text-text-secondary">
          Formatos: JPG, PNG, WEBP · Máx. 20 imágenes
        </p>
      </div>

      {/* Media grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((item, index) => {
            const isDeleting = item.id === deletingId
            return (
              <div
                key={index}
                className={cn(
                  'relative rounded-md border overflow-hidden bg-surface',
                  item.isPrimary ? 'border-accent-gold ring-2 ring-accent-gold ring-offset-1' : 'border-border',
                  isDeleting && 'opacity-50',
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-[3/4] bg-surface-2">
                  <Image
                    src={item.url}
                    alt={item.altText || 'Imagen de producto'}
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized={item.url.startsWith('blob:')}
                  />
                  {item.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 bg-accent-gold text-text-primary-inverse text-[10px] font-medium px-1.5 py-0.5 rounded font-sans">
                      Portada
                    </span>
                  )}
                </div>

                {/* Controls */}
                <div className="p-2 space-y-1.5">
                  <input
                    type="text"
                    value={item.altText}
                    onChange={(e) => handleAltChange(index, e.target.value)}
                    placeholder="Texto alternativo"
                    className="w-full text-xs px-2 py-1 border border-border rounded font-sans text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold"
                  />

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        aria-label="Mover arriba"
                        className="p-1 rounded hover:bg-white/8 disabled:opacity-30 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === media.length - 1}
                        aria-label="Mover abajo"
                        className="p-1 rounded hover:bg-white/8 disabled:opacity-30 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M6 3v6M9 6l-3 3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(index)}
                        className="text-[10px] font-sans text-text-secondary hover:text-text-primary transition-colors px-1"
                      >
                        Portada
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item, index)}
                      disabled={isDeleting}
                      aria-label="Eliminar imagen"
                      className="p-1 rounded text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {media.length === 0 && !uploading && (
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <p className="font-sans text-sm text-text-secondary">
            Sin imágenes. Sube al menos una imagen para el producto.
          </p>
        </div>
      )}
    </div>
  )
}
