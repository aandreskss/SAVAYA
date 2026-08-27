'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs } from '@/shared/ui/Tabs'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui'
import { saveProductAction } from '../actions'
import { GeneralTab } from './tabs/GeneralTab'
import { MediaTab } from './tabs/MediaTab'
import { VariantsTab } from './tabs/VariantsTab'
import { SeoTab, getModeFromPublishedAt } from './tabs/SeoTab'
import type { GeneralTabState } from './tabs/GeneralTab'
import type { MediaItem } from './tabs/MediaTab'
import type { VariantRow } from './tabs/VariantsTab'
import type { SeoTabState } from './tabs/SeoTab'
import type { AdminProductForEdit, ColorOption, SizeOption, CategoryOption, CollectionOption } from '../types'

type Props = {
  product?: AdminProductForEdit
  colors: ColorOption[]
  sizes: SizeOption[]
  categories: CategoryOption[]
  collections: CollectionOption[]
}

function initGeneral(product?: AdminProductForEdit): GeneralTabState {
  return {
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    categoryId: product?.categoryId ?? '',
    collectionIds: product?.collectionIds ?? [],
    gender: product?.gender ?? 'women',
    productType: product?.productType ?? 'shoes',
    basePrice: product?.basePrice ? String(product.basePrice) : '',
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : '',
    isFeatured: product?.isFeatured ?? false,
    isNew: product?.isNew ?? false,
    isActive: product?.isActive ?? true,
    tags: product?.tags?.join(', ') ?? '',
  }
}

function initMedia(product?: AdminProductForEdit): MediaItem[] {
  return (product?.media ?? []).map((m) => ({
    id: m.id,
    cloudinaryPublicId: m.cloudinaryPublicId,
    url: m.url,
    altText: m.altText ?? '',
    isPrimary: m.isPrimary,
    sortOrder: m.sortOrder,
    colorId: m.colorId ?? null,
  }))
}

function initVariants(product?: AdminProductForEdit): VariantRow[] {
  return (product?.variants ?? []).map((v) => ({
    id: v.id,
    colorId: v.colorId,
    colorName: v.colorName,
    colorHex: v.colorHex,
    sizeId: v.sizeId,
    sizeName: v.sizeName,
    sku: v.sku,
    price: String(v.price),
    compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : '',
    isActive: v.isActive,
    initialStock: v.stock,
  }))
}

function initSeo(product?: AdminProductForEdit): SeoTabState {
  const publishedAt = product?.publishedAt ? product.publishedAt.toISOString() : ''
  return {
    seoTitle: product?.seoTitle ?? '',
    seoDescription: product?.seoDescription ?? '',
    seoKeywords: product?.seoKeywords ?? '',
    metaImageUrl: product?.metaImageUrl ?? '',
    publishedAt,
    publishMode: getModeFromPublishedAt(publishedAt || null),
  }
}

export function ProductEditor({ product, colors, sizes, categories, collections }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [general, setGeneral] = useState<GeneralTabState>(() => initGeneral(product))
  const [media, setMedia] = useState<MediaItem[]>(() => initMedia(product))
  const [variants, setVariants] = useState<VariantRow[]>(() => initVariants(product))
  const [seo, setSeo] = useState<SeoTabState>(() => initSeo(product))

  function handleSave() {
    startTransition(async () => {
      const activeVariants = variants.filter((v) => v.isActive !== false)
      const badVariant = activeVariants.find((v) => !(parseFloat(v.price) > 0))
      if (badVariant) {
        toast.error(`El precio de la variante "${badVariant.sku}" debe ser mayor a 0`)
        return
      }

      const tags = general.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        id: product?.id,
        name: general.name,
        slug: general.slug,
        description: general.description || null,
        categoryId: general.categoryId || null,
        collectionIds: general.collectionIds,
        gender: general.gender,
        productType: general.productType || 'shoes',
        basePrice: parseFloat(general.basePrice) || 0,
        compareAtPrice: parseFloat(general.compareAtPrice) || null,
        isFeatured: general.isFeatured,
        isNew: general.isNew,
        isActive: general.isActive,
        tags,
        seoTitle: seo.seoTitle || null,
        seoDescription: seo.seoDescription || null,
        seoKeywords: seo.seoKeywords || null,
        metaImageUrl: seo.metaImageUrl || null,
        publishedAt: seo.publishMode === 'draft' ? null : (seo.publishedAt || null),
        variants: variants.map((v) => ({
          id: v.id,
          colorId: v.colorId,
          sizeId: v.sizeId,
          sku: v.sku,
          price: parseFloat(v.price),
          compareAtPrice: parseFloat(v.compareAtPrice) || null,
          isActive: v.isActive,
          initialStock: v.id ? 0 : (v.initialStock ?? 0),
        })),
        media: media.map((m) => ({
          id: m.id,
          cloudinaryPublicId: m.cloudinaryPublicId,
          url: m.url,
          altText: m.altText || null,
          isPrimary: m.isPrimary,
          sortOrder: m.sortOrder,
          colorId: m.colorId ?? null,
        })),
      }

      const result = await saveProductAction(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(product ? 'Producto actualizado' : 'Producto creado')

      if (!product) {
        router.push(`/admin/productos/${result.data.id}`)
      }
    })
  }

  const tabs = [
    {
      id: 'general',
      label: 'General',
      content: (
        <GeneralTab
          state={general}
          categories={categories}
          collections={collections}
          onChange={(patch) => setGeneral((s) => ({ ...s, ...patch }))}
        />
      ),
    },
    {
      id: 'media',
      label: `Media${media.length > 0 ? ` (${media.length})` : ''}`,
      content: (
        <MediaTab
          productId={product?.id}
          media={media}
          colors={colors}
          onChange={setMedia}
        />
      ),
    },
    {
      id: 'variantes',
      label: `Variantes${variants.filter((v) => v.isActive !== false).length > 0 ? ` (${variants.filter((v) => v.isActive !== false).length})` : ''}`,
      content: (
        <VariantsTab
          variants={variants}
          colors={colors}
          sizes={sizes}
          basePrice={general.basePrice}
          productName={general.name}
          onChange={setVariants}
        />
      ),
    },
    {
      id: 'seo',
      label: 'SEO',
      content: (
        <SeoTab
          state={seo}
          productName={general.name}
          onChange={(patch) => setSeo((s) => ({ ...s, ...patch }))}
        />
      ),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          {product && (
            <p className="text-text-secondary text-sm mt-0.5">{product.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {product && (
            <a
              href={`/producto/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-text-secondary hover:text-text-primary underline-offset-2 hover:underline transition-colors"
            >
              Ver en tienda ↗
            </a>
          )}
          <Button onClick={handleSave} isLoading={isPending} size="md">
            {product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6">
          <Tabs tabs={tabs} defaultTab="general" />
        </div>
      </div>
    </div>
  )
}
