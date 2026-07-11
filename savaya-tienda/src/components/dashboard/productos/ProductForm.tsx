'use client'

import { useState, useRef, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { GENDERS, PRODUCT_TYPES } from '@/lib/constants'
import { saveProduct, createSubcategory, deleteSubcategory } from '@/app/dashboard/productos/actions'
import type { VariantInput } from '@/app/dashboard/productos/actions'
import ImageUploader from './ImageUploader'
import VariantsManager, { type VariantRow } from './VariantsManager'
import ColorImagesManager from './ColorImagesManager'
import TagInput from './TagInput'
import type { Product, ProductVariant, ProductType } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductWithVariants = Product & { variants?: ProductVariant[] }

interface CategoryOption {
  id: string
  name: string
  gender: string | null
  slug: string
  product_type: string
}

interface BrandOption {
  id: string
  name: string
}

interface ProductFormProps {
  categories: CategoryOption[]
  brands?: BrandOption[]
  product?: ProductWithVariants
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  slug: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .regex(/^[a-z0-9][a-z0-9/-]*$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string(),
  category_id: z.string().min(1, 'Selecciona una subcategoría'),
  gender: z.enum(['women', 'men', 'kids', 'unisex']),
  type: z.enum(['clothing', 'shoes', 'accessories']),
  base_price: z.number().min(0.01, 'Debe ser mayor a 0'),
  sale_price_raw: z.string(),
  wholesale_price_raw: z.string(),
  divisa_price_raw: z.string(),
  wholesale_divisa_price_raw: z.string(),
  is_new: z.boolean(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT =
  'w-full border border-gray-light rounded px-3 py-2.5 text-sm font-body focus:border-black focus:outline-none transition-colors'
const LABEL = 'block text-sm font-heading font-semibold text-black mb-1.5'
const ERROR = 'text-xs text-sale font-body mt-1'
const CARD = 'bg-white rounded border border-gray-light p-5'

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductForm({ categories, brands = [], product }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreatingSubcat, startSubcatTransition] = useTransition()
  const isEditing = !!product

  // State for complex fields managed outside react-hook-form
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [tags, setTags] = useState<string[]>(product?.tags ?? [])
  const [variants, setVariants] = useState<VariantRow[]>(
    () =>
      product?.variants?.map((v) => ({
        tempId: crypto.randomUUID(),
        productVariantId: v.id,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex,
        stock: v.stock,
        sku: v.sku,
      })) ?? []
  )
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])
  const [colorImages, setColorImages] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const ci of product?.color_images ?? []) {
      map[ci.color] = ci.images
    }
    return map
  })
  const [selectedBrandId, setSelectedBrandId] = useState<string>(product?.brand_id ?? '')
  const [serverError, setServerError] = useState('')
  const [imagesError, setImagesError] = useState('')
  const [variantsError, setVariantsError] = useState('')

  // Active product type filter (Ropa / Zapatos / Accesorios)
  const [selectedType, setSelectedType] = useState<string>(() => {
    if (product?.category_id) {
      const cat = categories.find((c) => c.id === product.category_id)
      return cat?.product_type ?? ''
    }
    return ''
  })

  // Subcategory creation/management state
  const [localCategories, setLocalCategories] = useState<CategoryOption[]>(categories)
  const [showNewSubcatForm, setShowNewSubcatForm] = useState(false)
  const [showManageSubcats, setShowManageSubcats] = useState(false)
  const [newSubcatName, setNewSubcatName] = useState('')
  const [newSubcatType, setNewSubcatType] = useState<ProductType>('clothing')
  const [newSubcatGender, setNewSubcatGender] = useState<string>('')
  const [subcatError, setSubcatError] = useState('')
  const [deletingSubcatId, setDeletingSubcatId] = useState<string | null>(null)
  const [deleteSubcatError, setDeleteSubcatError] = useState<Record<string, string>>({})

  // Track if slug was manually edited (stop auto-generation once user edits)
  const slugManuallyEdited = useRef(isEditing)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      category_id: product?.category_id ?? '',
      gender: product?.gender ?? 'women',
      type: product?.type ?? 'clothing',
      base_price: product?.base_price ?? ('' as unknown as number),
      sale_price_raw: product?.sale_price ? String(product.sale_price) : '',
      wholesale_price_raw: product?.wholesale_price ? String(product.wholesale_price) : '',
      divisa_price_raw: product?.divisa_price ? String(product.divisa_price) : '',
      wholesale_divisa_price_raw: product?.wholesale_divisa_price ? String(product.wholesale_divisa_price) : '',
      is_new: product?.is_new ?? false,
      is_featured: product?.is_featured ?? false,
      is_active: product?.is_active ?? true,
    },
  })

  const name = watch('name')
  const selectedGender = watch('gender')
  const categoryId = watch('category_id')

  // Filter categories by selected gender; null-gender = universal (shows for all)
  // Optionally also filter by product type (selectedType)
  const filteredCategories = useMemo(() => {
    let cats = localCategories
    if (selectedGender && selectedGender !== 'unisex') {
      cats = cats.filter((c) => c.gender === selectedGender || !c.gender)
    }
    if (selectedType) {
      cats = cats.filter((c) => c.product_type === selectedType)
    }
    return cats
  }, [localCategories, selectedGender, selectedType])

  // Unique colors derived from current variants (for ColorImagesManager)
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>()
    const result: { name: string; hex: string }[] = []
    for (const v of variants) {
      if (v.color && !seen.has(v.color)) {
        seen.add(v.color)
        result.push({ name: v.color, hex: v.color_hex })
      }
    }
    return result
  }, [variants])

  // Auto-generate slug from gender + category + name
  useEffect(() => {
    if (slugManuallyEdited.current || !name) return
    const GENDER_SLUGS: Record<string, string> = {
      women: 'mujer', men: 'hombre', kids: 'ninos', unisex: 'unisex',
    }
    const genderPart = selectedGender ? (GENDER_SLUGS[selectedGender] ?? selectedGender) : null
    const cat = localCategories.find((c) => c.id === categoryId)
    const catPart = cat?.slug ?? null
    const namePart = slugify(name)
    const parts = [genderPart, catPart, namePart].filter(Boolean)
    setValue('slug', parts.join('/'), { shouldValidate: false })
  }, [name, categoryId, selectedGender, localCategories, setValue])

  function handleCategoryChange(catId: string) {
    setValue('category_id', catId, { shouldValidate: true })
    const cat = localCategories.find((c) => c.id === catId)
    if (cat?.product_type) {
      setValue('type', cat.product_type as ProductType)
      setSelectedType(cat.product_type)
    }
  }

  function handleCreateSubcat() {
    if (!newSubcatName.trim()) {
      setSubcatError('Escribe un nombre')
      return
    }
    setSubcatError('')
    // newSubcatGender: '' = para todos (null), else 'women'|'men'|'kids'
    const genderArg = (newSubcatGender || null) as 'women' | 'men' | 'kids' | null
    startSubcatTransition(async () => {
      const result = await createSubcategory(newSubcatName.trim(), genderArg, newSubcatType)
      if ('error' in result) {
        setSubcatError(result.error)
        return
      }
      const newCat: CategoryOption = {
        id: result.category.id,
        name: result.category.name,
        slug: result.category.slug,
        gender: result.category.gender,
        product_type: result.category.product_type,
      }
      setLocalCategories((prev) => [...prev, newCat])
      handleCategoryChange(newCat.id)
      setShowNewSubcatForm(false)
      setNewSubcatName('')
      setNewSubcatType('clothing')
      setNewSubcatGender('')
    })
  }

  function handleDeleteSubcat(catId: string) {
    setDeletingSubcatId(catId)
    setDeleteSubcatError((prev) => ({ ...prev, [catId]: '' }))
    startSubcatTransition(async () => {
      const result = await deleteSubcategory(catId)
      setDeletingSubcatId(null)
      if ('error' in result) {
        setDeleteSubcatError((prev) => ({ ...prev, [catId]: result.error }))
        return
      }
      // If the deleted cat was selected, clear the selection
      if (watch('category_id') === catId) {
        setValue('category_id', '')
      }
      setLocalCategories((prev) => prev.filter((c) => c.id !== catId))
    })
  }

  function handleVariantsChange(newVariants: VariantRow[], newDeletedIds: string[]) {
    setVariants(newVariants)
    setDeletedVariantIds(newDeletedIds)
  }

  async function onSubmit(values: FormValues) {
    // Validate complex fields
    let hasError = false
    if (images.length === 0) {
      setImagesError('Agrega al menos 1 imagen')
      hasError = true
    } else {
      setImagesError('')
    }
    if (variants.length === 0) {
      setVariantsError('Agrega al menos 1 variante')
      hasError = true
    } else {
      setVariantsError('')
    }
    if (hasError) return

    const salePrice = values.sale_price_raw
      ? parseFloat(values.sale_price_raw)
      : null
    const salePriceFinal = salePrice && salePrice > 0 ? salePrice : null

    const wholesalePrice = values.wholesale_price_raw
      ? parseFloat(values.wholesale_price_raw)
      : null
    const wholesalePriceFinal = wholesalePrice && wholesalePrice > 0 ? wholesalePrice : null

    const divisaPrice = values.divisa_price_raw
      ? parseFloat(values.divisa_price_raw)
      : null
    const divisaPriceFinal = divisaPrice && divisaPrice > 0 ? divisaPrice : null
    const wholesaleDivisaPrice = values.wholesale_divisa_price_raw
      ? parseFloat(values.wholesale_divisa_price_raw)
      : null
    const wholesaleDivisaPriceFinal = wholesaleDivisaPrice && wholesaleDivisaPrice > 0 ? wholesaleDivisaPrice : null

    const formData = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      category_id: values.category_id,
      brand_id: selectedBrandId || null,
      gender: values.gender,
      type: values.type,
      base_price: values.base_price,
      sale_price: salePriceFinal,
      wholesale_price: wholesalePriceFinal,
      divisa_price: divisaPriceFinal,
      wholesale_divisa_price: wholesaleDivisaPriceFinal,
      is_new: values.is_new,
      is_featured: values.is_featured,
      is_active: values.is_active,
      tags,
      images,
      variants: variants as VariantInput[],
      deletedVariantIds,
      color_images: colorImages,
    }

    startTransition(async () => {
      const result = await saveProduct(formData, product?.id)
      if ('error' in result) {
        setServerError(result.error)
        return
      }
      router.push('/dashboard/productos')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-black">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          {isEditing && (
            <p className="text-sm text-gray-text font-body mt-0.5">{product.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/productos')}
            className="text-sm font-body text-gray-text hover:text-black transition-colors px-4 py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isPending ? 'Guardando…' : 'Guardar producto'}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-sale font-body">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic info */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-4">
              Información básica
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Nombre *</label>
                <input {...register('name')} className={INPUT} placeholder="Ej: Vestido Floral Primavera" />
                {errors.name && <p className={ERROR}>{errors.name.message}</p>}
              </div>

              <div>
                <label className={LABEL}>Slug (URL) *</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-text font-body shrink-0">/</span>
                  <input
                    {...register('slug', {
                      onChange: () => { slugManuallyEdited.current = true },
                    })}
                    className={INPUT}
                    placeholder="vestido-floral-primavera"
                  />
                </div>
                {errors.slug && <p className={ERROR}>{errors.slug.message}</p>}
              </div>

              <div>
                <label className={LABEL}>Descripción</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className={`${INPUT} resize-none`}
                  placeholder="Describe el producto, materiales, cuidados…"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-1">Imágenes *</h2>
            <p className="text-[11px] text-gray-text font-body mb-4">
              La primera imagen es la portada. Arrastra para reordenar.
            </p>
            <ImageUploader images={images} onChange={setImages} error={imagesError} />
          </div>

          {/* Variants */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-1">Variantes *</h2>
            <p className="text-[11px] text-gray-text font-body mb-4">
              Define talla, color y stock por cada variante disponible.
            </p>
            <VariantsManager
              variants={variants}
              deletedIds={deletedVariantIds}
              onVariantsChange={handleVariantsChange}
              error={variantsError}
            />
          </div>

          {/* Color images */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-1">
              Imágenes por color
            </h2>
            <p className="text-[11px] text-gray-text font-body mb-4">
              Sube fotos específicas para cada color. Si un color no tiene fotos propias,
              se muestran las imágenes generales del producto.
            </p>
            <ColorImagesManager
              colors={uniqueColors}
              colorImages={colorImages}
              onChange={setColorImages}
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* Status */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Estado</h2>
            <div className="space-y-3">
              {[
                { name: 'is_active' as const, label: 'Producto activo', desc: 'Visible en la tienda' },
                { name: 'is_new' as const, label: 'Nuevo', desc: 'Badge NUEVO en la tarjeta' },
                { name: 'is_featured' as const, label: 'Más vendido', desc: 'Aparece en «Los más vendidos» de la home' },
              ].map(({ name: n, label, desc }) => (
                <label key={n} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register(n)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-light accent-black cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-body font-medium text-black group-hover:text-accent transition-colors">
                      {label}
                    </p>
                    <p className="text-[11px] text-gray-text font-body">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Clasificación</h2>
            <div className="space-y-4">
              {/* Gender — always first */}
              <div>
                <label className={LABEL}>Género *</label>
                <select {...register('gender')} className={INPUT}>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product type filter (Ropa / Zapatos / Accesorios) */}
              <div>
                <label className={LABEL}>Categoría</label>
                <div className="flex gap-2">
                  {PRODUCT_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedType((prev) => (prev === value ? '' : value))}
                      className={[
                        'flex-1 py-2 text-xs font-heading font-semibold rounded border transition-colors',
                        selectedType === value
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-text border-gray-light hover:border-black hover:text-black',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-text font-body mt-1">
                  Filtra las subcategorías. Toca de nuevo para quitar el filtro.
                </p>
              </div>

              {/* Subcategory — filtered by gender and type */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${LABEL} mb-0`}>Subcategoría *</label>
                  {selectedGender && selectedGender !== 'unisex' && (
                    <div className="flex items-center gap-2">
                      {filteredCategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setShowManageSubcats((v) => !v); setShowNewSubcatForm(false) }}
                          className="text-xs text-gray-text font-heading hover:text-black transition-colors"
                        >
                          {showManageSubcats ? 'Listo' : 'Gestionar'}
                        </button>
                      )}
                      {!showManageSubcats && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewSubcatForm((v) => !v)
                            setSubcatError('')
                            if (!showNewSubcatForm) {
                              setNewSubcatGender(selectedGender ?? '')
                              if (selectedType) setNewSubcatType(selectedType as ProductType)
                            }
                          }}
                          className="text-xs text-black font-heading font-semibold hover:text-accent transition-colors flex items-center gap-1"
                        >
                          <span className="text-base leading-none">+</span> Nueva
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Manage subcategories panel */}
                {showManageSubcats && (
                  <div className="mb-3 border border-gray-light rounded divide-y divide-gray-light">
                    {filteredCategories.map((cat) => {
                      const genderLabel = !cat.gender ? 'Todos' : cat.gender === 'women' ? 'Mujer' : cat.gender === 'men' ? 'Hombre' : 'Niños'
                      return (
                      <div key={cat.id} className="flex items-center justify-between px-3 py-2 gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-body truncate">{cat.name}</p>
                          <p className="text-[10px] text-gray-text font-body">{genderLabel}</p>
                          {deleteSubcatError[cat.id] && (
                            <p className="text-[11px] text-sale font-body mt-0.5">{deleteSubcatError[cat.id]}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={deletingSubcatId === cat.id}
                          onClick={() => handleDeleteSubcat(cat.id)}
                          className="shrink-0 text-gray-text hover:text-sale transition-colors disabled:opacity-40 p-1"
                          aria-label={`Eliminar ${cat.name}`}
                          title="Eliminar subcategoría"
                        >
                          {deletingSubcatId === cat.id ? (
                            <span className="block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="2" y1="2" x2="12" y2="12" />
                              <line x1="12" y1="2" x2="2" y2="12" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )
                  })}
                  </div>
                )}

                {/* Inline new subcategory form */}
                {showNewSubcatForm && (
                  <div className="mb-3 p-3 border border-gold/40 rounded bg-gold/5 space-y-2">
                    <input
                      type="text"
                      value={newSubcatName}
                      onChange={(e) => setNewSubcatName(e.target.value)}
                      placeholder="Nombre de la subcategoría"
                      className={INPUT}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSubcat() } }}
                    />
                    <select
                      value={newSubcatGender}
                      onChange={(e) => setNewSubcatGender(e.target.value)}
                      className={INPUT}
                    >
                      <option value="">Para todos (unisex)</option>
                      <option value="women">Mujer</option>
                      <option value="men">Hombre</option>
                      <option value="kids">Niños</option>
                    </select>
                    <select
                      value={newSubcatType}
                      onChange={(e) => setNewSubcatType(e.target.value as ProductType)}
                      className={INPUT}
                    >
                      <option value="clothing">Ropa</option>
                      <option value="shoes">Zapatos</option>
                      <option value="accessories">Accesorios</option>
                    </select>
                    {subcatError && <p className={ERROR}>{subcatError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateSubcat}
                        disabled={isCreatingSubcat}
                        className="flex-1 bg-black text-white text-xs font-heading font-semibold py-2 rounded hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        {isCreatingSubcat ? 'Creando…' : 'Crear'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewSubcatForm(false); setSubcatError('') }}
                        className="px-3 text-xs font-heading text-gray-text hover:text-black transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={watch('category_id')}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={INPUT}
                >
                  <option value="">
                    {filteredCategories.length === 0
                      ? 'No hay subcategorías — crea una'
                      : 'Seleccionar subcategoría…'}
                  </option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className={ERROR}>{errors.category_id.message}</p>
                )}

                {/* Hidden type field — auto-derived from subcategory */}
                <input type="hidden" {...register('type')} />
              </div>
            </div>
          </div>

          {/* Brand */}
          {brands.length > 0 && (
            <div className={CARD}>
              <h2 className="text-sm font-heading font-semibold text-black mb-4">Marca</h2>
              <div>
                <label className={LABEL}>Marca</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className={INPUT}
                >
                  <option value="">Sin marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-text font-body mt-1">
                  La marca aparecerá en el menú de MARCAS de la tienda.
                </p>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Precios</h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Precio base *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm font-body">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    {...register('base_price', { valueAsNumber: true })}
                    className={`${INPUT} pl-7`}
                    placeholder="89900"
                  />
                </div>
                {errors.base_price && (
                  <p className={ERROR}>{errors.base_price.message}</p>
                )}
              </div>

              <div>
                <label className={LABEL}>
                  Precio de oferta{' '}
                  <span className="text-gray-text font-body font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm font-body">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    {...register('sale_price_raw')}
                    className={`${INPUT} pl-7`}
                    placeholder="59900"
                  />
                </div>
                <p className="text-[11px] text-gray-text font-body mt-1">
                  Muestra badge de % OFF en la tarjeta
                </p>
              </div>

              <div>
                <label className={LABEL}>
                  Precio al mayor{' '}
                  <span className="text-gray-text font-body font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm font-body">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    {...register('wholesale_price_raw')}
                    className={`${INPUT} pl-7`}
                    placeholder="45000"
                  />
                </div>
                <p className="text-[11px] text-gray-text font-body mt-1">
                  Se aplica cuando el total del carrito supera la cantidad mínima configurada en Ajustes
                </p>
              </div>

              <div>
                <label className={LABEL}>
                  Precio en Divisa (Zelle/USDT/Binance){' '}
                  <span className="text-gray-text font-body font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm font-body">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    {...register('divisa_price_raw')}
                    className={`${INPUT} pl-7`}
                    placeholder="25.00"
                  />
                </div>
                <p className="text-[11px] text-gray-text font-body mt-1">
                  Precio real en hard currency. Si se llena, se mostrará como opción más económica de pago en la tienda.
                </p>
              </div>

              <div>
                <label className={LABEL}>
                  Precio en Divisa al Mayor{' '}
                  <span className="text-gray-text font-body font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm font-body">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    {...register('wholesale_divisa_price_raw')}
                    className={`${INPUT} pl-7`}
                    placeholder="20.00"
                  />
                </div>
                <p className="text-[11px] text-gray-text font-body mt-1">
                  Precio en divisa cuando el pedido supera la cantidad mínima al mayor. Reemplaza el precio divisa normal.
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Tags</h2>
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="mt-6 flex items-center justify-end gap-3 py-4 border-t border-gray-light">
        <button
          type="button"
          onClick={() => router.push('/dashboard/productos')}
          className="text-sm font-body text-gray-text hover:text-black transition-colors px-4 py-2.5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-6 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isPending && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isPending ? 'Guardando…' : 'Guardar producto'}
        </button>
      </div>
    </form>
  )
}
