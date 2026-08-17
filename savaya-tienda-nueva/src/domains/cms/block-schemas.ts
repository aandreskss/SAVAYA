import { z } from 'zod'

// ---------------------------------------------------------------------------
// Individual block schemas — one per CMS block type
// ---------------------------------------------------------------------------

export const AnnouncementBarSchema = z.object({
  text: z.string().max(200),
  linkText: z.string().max(50).optional(),
  linkHref: z.string().optional(),
  bgColor: z.enum(['brand-black', 'accent-gold']).default('brand-black'),
})

export const HeroSchema = z.object({
  headline: z.string().max(100),
  subheadline: z.string().max(200).optional(),
  ctaPrimaryText: z.string().max(50),
  ctaPrimaryHref: z.string(),
  ctaSecondaryText: z.string().max(50).optional(),
  ctaSecondaryHref: z.string().optional(),
  imageDesktopUrl: z.string().url(),
  imageMobileUrl: z.string().url(),
  imageAlt: z.string().max(150),
  overlayOpacity: z.number().min(0).max(0.8).default(0.3),
})

export const ShopByCategorySchema = z.object({
  title: z.string().max(80).default('Compra por categoría'),
  categories: z
    .array(
      z.object({
        name: z.string(),
        slug: z.string(),
        imageUrl: z.string().url(),
      }),
    )
    .min(1)
    .max(8),
})

export const ProductCarouselSchema = z.object({
  title: z.string().max(80),
  subtitle: z.string().max(150).optional(),
  source: z.enum(['new', 'bestseller', 'featured', 'collection']),
  // Note: collectionSlug is not cross-validated against source at schema level.
  // If source === 'collection' and collectionSlug is absent, the repository
  // layer will fall back to an empty result. This is documented as a known
  // limitation — cross-field validation can be added later via .superRefine().
  collectionSlug: z.string().optional(),
  limit: z.number().min(4).max(12).default(8),
  ctaText: z.string().max(50).optional(),
  ctaHref: z.string().optional(),
  bgVariant: z.enum(['default', 'sand']).default('default'),
})

export const PromoBannerSchema = z.object({
  headline: z.string().max(80),
  subheadline: z.string().max(150).optional(),
  ctaText: z.string().max(50),
  ctaHref: z.string(),
})

export const EditorialBlockSchema = z.object({
  eyebrow: z.string().max(50).optional(),
  headline: z.string().max(100),
  body: z.string().max(500),
  ctaText: z.string().max(50).optional(),
  ctaHref: z.string().optional(),
  imageUrl: z.string().url(),
  imageAlt: z.string().max(150),
  imagePosition: z.enum(['left', 'right']).default('right'),
})

export const SplitBlockSchema = z.object({
  leftLabel: z.string().max(50).default('Mujer'),
  leftHref: z.string().default('/mujer'),
  leftImageUrl: z.string().url(),
  rightLabel: z.string().max(50).default('Hombre'),
  rightHref: z.string().default('/hombre'),
  rightImageUrl: z.string().url(),
})

export const BenefitsBlockSchema = z.object({
  title: z.string().max(80).optional(),
  benefits: z
    .array(
      z.object({
        icon: z.enum(['truck', 'shield', 'refresh', 'star', 'whatsapp', 'credit-card']),
        title: z.string().max(60),
        description: z.string().max(150),
      }),
    )
    .min(2)
    .max(6),
})

export const NewsletterSchema = z.object({
  headline: z.string().max(100).default('Únete a la comunidad SAVAYA'),
  subheadline: z.string().max(200).optional(),
  placeholder: z.string().max(60).default('Tu correo electrónico'),
  ctaText: z.string().max(40).default('Suscribirme'),
})

// ---------------------------------------------------------------------------
// Block type → schema map (used for generic validation in service.ts)
// ---------------------------------------------------------------------------

export const BLOCK_SCHEMAS = {
  announcement_bar: AnnouncementBarSchema,
  hero: HeroSchema,
  shop_by_category: ShopByCategorySchema,
  product_carousel: ProductCarouselSchema,
  editorial_block: EditorialBlockSchema,
  split_block: SplitBlockSchema,
  benefits_block: BenefitsBlockSchema,
  newsletter: NewsletterSchema,
  promo_banner: PromoBannerSchema,
} as const

export type BlockType = keyof typeof BLOCK_SCHEMAS
export type BlockContent<T extends BlockType> = z.infer<(typeof BLOCK_SCHEMAS)[T]>
