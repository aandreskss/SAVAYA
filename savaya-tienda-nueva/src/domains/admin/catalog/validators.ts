import { z } from 'zod'

const VariantSchema = z.object({
  id: z.string().uuid().optional(),
  colorId: z.string().uuid(),
  sizeId: z.string().uuid(),
  sku: z.string().min(1, 'El SKU es requerido').max(100),
  price: z.number().positive('El precio debe ser mayor a 0'),
  compareAtPrice: z.number().positive().nullable(),
  isActive: z.boolean(),
  initialStock: z.number().int().min(0).default(0),
})

const MediaSchema = z.object({
  id: z.string().uuid().optional(),
  cloudinaryPublicId: z.string().min(1),
  url: z.string().url(),
  altText: z.string().max(200).nullable(),
  isPrimary: z.boolean(),
  sortOrder: z.number().int().min(0),
  colorId: z.string().uuid().nullable().optional(),
})

export const SaveProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(5000).nullable(),
  categoryId: z.string().uuid().nullable(),
  collectionIds: z.array(z.string().uuid()),
  gender: z.enum(['women', 'men', 'unisex']),
  productType: z.string().min(1).max(100).default('shoes'),
  basePrice: z.number().positive('El precio base debe ser mayor a 0'),
  compareAtPrice: z.number().positive().nullable(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string().trim().max(50)).max(20),
  seoTitle: z.string().max(70).nullable(),
  seoDescription: z.string().max(160).nullable(),
  seoKeywords: z.string().max(500).nullable(),
  metaImageUrl: z
    .string()
    .url()
    .nullable()
    .or(z.literal('').transform((): null => null)),
  publishedAt: z.string().datetime().nullable(),
  variants: z.array(VariantSchema).max(200),
  media: z.array(MediaSchema).max(20),
  deleteVariantIds: z.array(z.string().uuid()).optional().default([]),
})

export type SaveProductInput = z.infer<typeof SaveProductSchema>

export const SaveCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(500).nullable(),
  parentId: z.string().uuid().nullable(),
  imageUrl: z
    .string()
    .url()
    .nullable()
    .or(z.literal('').transform((): null => null)),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export type SaveCategoryInput = z.infer<typeof SaveCategorySchema>

export const SaveCollectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(500).nullable(),
  imageUrl: z
    .string()
    .url()
    .nullable()
    .or(z.literal('').transform((): null => null)),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
})

export type SaveCollectionInput = z.infer<typeof SaveCollectionSchema>
