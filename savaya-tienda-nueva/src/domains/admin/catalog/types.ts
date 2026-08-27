// ---------------------------------------------------------------------------
// Admin catalog types — separate from storefront types in catalog/repository.ts
// ---------------------------------------------------------------------------

export type AdminProductRow = {
  id: string
  name: string
  slug: string
  basePrice: number
  compareAtPrice: number | null
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  publishedAt: Date | null
  categoryName: string | null
  primaryImageUrl: string | null
  variantCount: number
  totalStock: number
  createdAt: Date
}

export type AdminVariantForEdit = {
  id: string
  colorId: string
  colorName: string
  colorHex: string
  sizeId: string
  sizeName: string
  sku: string
  price: number
  compareAtPrice: number | null
  isActive: boolean
  stock: number
}

export type AdminMediaItemForEdit = {
  id: string
  cloudinaryPublicId: string
  url: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
  variantId: string | null
  colorId: string | null
}

export type AdminProductForEdit = {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string | null
  collectionIds: string[]
  gender: 'women' | 'men' | 'unisex'
  productType: string
  basePrice: number
  compareAtPrice: number | null
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  tags: string[]
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  metaImageUrl: string | null
  publishedAt: Date | null
  variants: AdminVariantForEdit[]
  media: AdminMediaItemForEdit[]
}

export type AdminCategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
  parentName: string | null
  isActive: boolean
  sortOrder: number
  productCount: number
}

export type AdminCollectionRow = {
  id: string
  name: string
  slug: string
  isActive: boolean
  isFeatured: boolean
  productCount: number
  startsAt: Date | null
  endsAt: Date | null
}

export type ColorOption = {
  id: string
  name: string
  hex: string | null
}

export type SizeOption = {
  id: string
  name: string
  sortOrder: number
}

export type CategoryOption = {
  id: string
  name: string
  parentId: string | null
}

export type CollectionOption = {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Payloads sent from client to server actions
// ---------------------------------------------------------------------------

export type VariantPayload = {
  id?: string
  colorId: string
  sizeId: string
  sku: string
  price: number
  compareAtPrice: number | null
  isActive: boolean
  initialStock: number
}

export type MediaPayload = {
  id?: string
  cloudinaryPublicId: string
  url: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
  colorId?: string | null
}

export type SaveProductPayload = {
  id?: string
  name: string
  slug: string
  description: string | null
  categoryId: string | null
  collectionIds: string[]
  gender: 'women' | 'men' | 'unisex'
  productType: string
  basePrice: number
  compareAtPrice: number | null
  isFeatured: boolean
  isNew: boolean
  isActive: boolean
  tags: string[]
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  metaImageUrl: string | null
  publishedAt: string | null
  variants: VariantPayload[]
  media: MediaPayload[]
  deleteVariantIds?: string[]
}

export type SaveCategoryPayload = {
  id?: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
}

export type SaveCollectionPayload = {
  id?: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  isFeatured: boolean
  startsAt: string | null
  endsAt: string | null
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
