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

export type BannerFormPayload = z.infer<typeof BannerFormSchema>
export type PopupFormPayload = z.infer<typeof PopupFormSchema>
