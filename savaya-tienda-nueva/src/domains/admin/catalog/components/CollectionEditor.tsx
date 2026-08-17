'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/shared/ui/Input'
import { Toggle } from '@/shared/ui/Toggle'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui'
import { slugify } from '@/shared/lib/slugify'
import { saveCollectionAction } from '../actions'

type CollectionData = {
  id?: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  isFeatured: boolean
  startsAt: Date | null
  endsAt: Date | null
}

type Props = {
  collection?: CollectionData
}

function toDatetimeLocal(d: Date | null): string {
  if (!d) return ''
  return d.toISOString().slice(0, 16)
}

export function CollectionEditor({ collection }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(collection?.name ?? '')
  const [slug, setSlug] = useState(collection?.slug ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [imageUrl, setImageUrl] = useState(collection?.imageUrl ?? '')
  const [isActive, setIsActive] = useState(collection?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(collection?.isFeatured ?? false)
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(collection?.startsAt ?? null))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(collection?.endsAt ?? null))

  function handleNameChange(n: string) {
    setName(n)
    if (!collection) setSlug(slugify(n))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveCollectionAction({
        id: collection?.id,
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive,
        isFeatured,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(collection ? 'Colección actualizada' : 'Colección creada')
      router.push('/admin/productos/colecciones')
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl uppercase tracking-wide">
          {collection ? 'Editar colección' : 'Nueva colección'}
        </h1>
        <Button onClick={handleSave} isLoading={isPending} size="md">
          {collection ? 'Guardar cambios' : 'Crear colección'}
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            isRequired
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            isRequired
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-sm font-medium text-text-primary">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-sans text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1 resize-y"
          />
        </div>

        <Input
          label="URL de imagen"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-sans text-sm font-medium text-text-primary block mb-1.5">
              Fecha de inicio (opcional)
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="h-11 w-full rounded-sm border border-border bg-surface px-4 font-sans text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
            />
          </div>
          <div>
            <label className="font-sans text-sm font-medium text-text-primary block mb-1.5">
              Fecha de fin (opcional)
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="h-11 w-full rounded-sm border border-border bg-surface px-4 font-sans text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <Toggle label="Colección activa" checked={isActive} onChange={setIsActive} />
          <Toggle label="Destacada en home" checked={isFeatured} onChange={setIsFeatured} />
        </div>
      </div>
    </div>
  )
}
