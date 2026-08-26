'use client'

import { useRef, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui/toast-store'

type CloudinarySigResponse = {
  isDev?: boolean
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  publicId: string
}

type Props = {
  label: string
  /** Exact recommended dimensions, e.g. "1920 × 700 px · horizontal" */
  hint: string
  value: string
  onChange: (url: string) => void
  required?: boolean
}

export function ImageUploader({ label, hint, value, onChange, required }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const sigRes = await fetch('/api/admin/cms/upload-signature')
      if (!sigRes.ok) throw new Error('Error al obtener firma de subida')
      const sig = (await sigRes.json()) as CloudinarySigResponse

      if (sig.isDev) {
        const blobUrl = URL.createObjectURL(file)
        setLocalPreview(blobUrl)
        onChange(blobUrl)
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sig.apiKey)
      formData.append('timestamp', String(sig.timestamp))
      formData.append('signature', sig.signature)
      formData.append('folder', sig.folder)
      formData.append('public_id', sig.publicId)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: 'POST', body: formData },
      )
      if (!uploadRes.ok) throw new Error('Error al subir a Cloudinary')
      const data = (await uploadRes.json()) as { secure_url: string }
      setLocalPreview(null)
      onChange(data.secure_url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  const previewSrc = localPreview || value || null

  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </p>
        <p className="text-[11px] text-text-secondary/60 mt-0.5">
          Tamaño exacto: <span className="font-semibold text-text-secondary">{hint}</span>
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            setLocalPreview(null)
            onChange(e.target.value)
          }}
          required={required}
          placeholder="https://res.cloudinary.com/..."
          className="flex-1 min-w-0 border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          isLoading={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0"
        >
          Subir
        </Button>
      </div>

      {previewSrc && (
        // Preview thumbnail — uses <img> because src can be a blob URL (not a whitelisted Cloudinary domain)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt=""
          className="h-24 w-full rounded-lg object-cover border border-border"
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
