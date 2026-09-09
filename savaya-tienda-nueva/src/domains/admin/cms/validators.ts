import { z } from 'zod'

export const ReorderSectionsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
})

export const ToggleSectionSchema = z.object({
  sectionId: z.string().uuid(),
  isActive: z.boolean(),
})

export const UpdateSectionContentSchema = z.object({
  sectionId: z.string().uuid(),
  type: z.string().min(1),
  content: z.record(z.string(), z.unknown()),
})

export const BannerFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100),
  imageDesktopUrl: z.string().url('URL de imagen desktop inválida'),
  imageMobileUrl: z.string().url('URL de imagen mobile inválida'),
  ctaText: z.string().max(80).nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const PopupFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100),
  imageUrl: z.string().url('URL de imagen inválida'),
  ctaText: z.string().max(80).nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  delaySeconds: z.number().int().min(0).max(120).default(5),
  showOnPagesRaw: z.string().optional(),
  maxShowsPerSession: z.number().int().min(1).max(10).default(1),
  isActive: z.boolean().default(true),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
})

export const CreateSectionSchema = z.object({
  pageSlug: z.string().min(1),
  type: z.string().min(1),
})

export const NavItemFormSchema = z.object({
  label: z.string().min(1, 'El label es requerido').max(60),
  type: z.enum(['link', 'category_group']),
  href: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v || null),
  gender: z.enum(['mujer', 'hombre']).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export type NavItemFormPayload = z.infer<typeof NavItemFormSchema>

export const DeleteSectionSchema = z.object({
  sectionId: z.string().uuid(),
})

export const CustomPageFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Solo letras minúsculas, números y guiones (sin espacios ni caracteres especiales)',
    ),
  title: z.string().min(1, 'El título es requerido').max(100),
})

export type BannerFormPayload = z.infer<typeof BannerFormSchema>
export type PopupFormPayload = z.infer<typeof PopupFormSchema>
export type CustomPageFormPayload = z.infer<typeof CustomPageFormSchema>
