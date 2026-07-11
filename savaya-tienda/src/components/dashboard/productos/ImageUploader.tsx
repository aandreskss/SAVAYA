'use client'

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import Image from 'next/image'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  error?: string
  maxImages?: number
}

export default function ImageUploader({
  images,
  onChange,
  error,
  maxImages = 8,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const draggedIndex = useRef<number | null>(null)

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files)
    const remaining = maxImages - images.length
    if (arr.length > remaining) {
      setUploadError(`Solo puedes subir ${remaining} imagen${remaining !== 1 ? 'es' : ''} más`)
      return
    }
    setUploadError('')
    setUploading(true)

    const newUrls: string[] = []
    for (const file of arr) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json() as { url?: string; error?: string }
        if (!res.ok || !json.url) {
          setUploadError(json.error ?? 'Error al subir imagen')
          break
        }
        newUrls.push(json.url)
      } catch {
        setUploadError('Error de red al subir imagen')
        break
      }
    }

    if (newUrls.length) onChange([...images, ...newUrls])
    setUploading(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      uploadFiles(e.target.files)
      e.target.value = ''
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  // Drag-to-reorder handlers
  function handleImageDragStart(index: number) {
    draggedIndex.current = index
  }

  function handleImageDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault()
    if (draggedIndex.current === null || draggedIndex.current === index) return
    const newImages = [...images]
    const [moved] = newImages.splice(draggedIndex.current, 1)
    newImages.splice(index, 0, moved)
    draggedIndex.current = index
    onChange(newImages)
  }

  function handleImageDragEnd() {
    draggedIndex.current = null
  }

  const canUpload = images.length < maxImages && !uploading

  return (
    <div>
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleImageDragStart(i)}
              onDragOver={(e) => handleImageDragOver(e, i)}
              onDragEnd={handleImageDragEnd}
              className="relative w-20 h-20 rounded border border-gray-light overflow-hidden group cursor-grab active:cursor-grabbing bg-white"
            >
              <Image src={url} alt={`Imagen ${i + 1}`} fill className="object-contain" sizes="80px" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center font-heading py-0.5">
                  PORTADA
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
                aria-label="Eliminar imagen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded transition-colors cursor-pointer px-4 py-8 text-center ${
            dragOver ? 'border-black bg-gray-bg' : 'border-gray-light hover:border-gray-text'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-text font-body">Subiendo…</p>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto mb-2 text-gray-text"
                width="28"
                height="28"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-body text-black">
                Arrastra imágenes aquí o{' '}
                <span className="underline underline-offset-2">haz clic para seleccionar</span>
              </p>
              <p className="text-[11px] text-gray-text font-body mt-1">
                JPG, PNG, WEBP · Máx 5MB · Tamaño ideal: 1100 × 1100 px (1:1) · {images.length}/{maxImages}
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {(uploadError || error) && (
        <p className="text-sm text-sale font-body mt-2">{uploadError || error}</p>
      )}
    </div>
  )
}
