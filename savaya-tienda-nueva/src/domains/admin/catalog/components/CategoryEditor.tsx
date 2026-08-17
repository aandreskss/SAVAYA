'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Toggle } from '@/shared/ui/Toggle'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui'
import { slugify } from '@/shared/lib/slugify'
import { saveCategoryAction } from '../actions'
import type { CategoryOption } from '../types'

type CategoryData = {
  id?: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
}

type Props = {
  category?: CategoryData
  parentOptions: CategoryOption[]
}

export function CategoryEditor({ category, parentOptions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [parentId, setParentId] = useState(category?.parentId ?? '')
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? '')
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0))

  function handleNameChange(n: string) {
    setName(n)
    if (!category) setSlug(slugify(n))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveCategoryAction({
        id: category?.id,
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        imageUrl: imageUrl || null,
        isActive,
        sortOrder: parseInt(sortOrder) || 0,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(category ? 'Categoría actualizada' : 'Categoría creada')
      router.push('/admin/productos/categorias')
    })
  }

  // Exclude self from parent options when editing
  const filteredParents = parentOptions.filter((c) => c.id !== category?.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl uppercase tracking-wide">
          {category ? 'Editar categoría' : 'Nueva categoría'}
        </h1>
        <Button onClick={handleSave} isLoading={isPending} size="md">
          {category ? 'Guardar cambios' : 'Crear categoría'}
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
            hint="/categoria/este-slug"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Categoría padre"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">Sin padre (nivel raíz)</option>
            {filteredParents.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>

          <Input
            label="Orden"
            type="number"
            min="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            hint="Menor número = aparece primero"
          />
        </div>

        <Input
          label="URL de imagen"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          hint="URL de Cloudinary para la imagen de la categoría"
        />

        <Toggle label="Categoría activa" checked={isActive} onChange={setIsActive} />
      </div>
    </div>
  )
}
