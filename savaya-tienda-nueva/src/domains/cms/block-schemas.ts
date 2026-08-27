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
  eyebrow: z.string().max(80).optional(),
  headline: z.string().max(100),
  headlineAccent: z.string().max(60).optional(),
  subheadline: z.string().max(200).optional(),
  ctaPrimaryText: z.string().max(50),
  ctaPrimaryHref: z.string(),
  ctaSecondaryText: z.string().max(50).optional(),
  ctaSecondaryHref: z.string().optional(),
  imageDesktopUrl: z.string().url(),
  imageMobileUrl: z.string().url(),
  imageAlt: z.string().max(150),
  overlayOpacity: z.number().min(0).max(0.9).default(0.45),
})

export const ShopByCategorySchema = z.object({
  eyebrow: z.string().max(60).optional(),
  title: z.string().max(80).default('Compra por categoría'),
  ctaText: z.string().max(50).optional(),
  ctaHref: z.string().optional(),
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
  eyebrow: z.string().max(60).optional(),
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
  eyebrow: z.string().max(60).optional(),
  headline: z.string().max(80),
  subheadline: z.string().max(150).optional(),
  ctaText: z.string().max(50),
  ctaHref: z.string(),
})

export const EditorialBlockSchema = z.object({
  variant: z.enum(['overlay', 'split']).default('overlay'),
  eyebrow: z.string().max(50).optional(),
  headline: z.string().max(100),
  headlineAccent: z.string().max(60).optional(),
  body: z.string().max(500),
  ctaText: z.string().max(50).optional(),
  ctaHref: z.string().optional(),
  imageUrl: z.string().url(),
  imageAlt: z.string().max(150),
  imagePosition: z.enum(['left', 'right']).default('right'),
})

export const SplitBlockSchema = z.object({
  leftEyebrow: z.string().max(60).optional(),
  leftLabel: z.string().max(50).default('Mujer'),
  leftHref: z.string().default('/mujer'),
  leftImageUrl: z.string().url(),
  rightEyebrow: z.string().max(60).optional(),
  rightLabel: z.string().max(50).default('Hombre'),
  rightHref: z.string().default('/hombre'),
  rightImageUrl: z.string().url(),
  rightShowMark: z.boolean().default(false),
})

export const BenefitsBlockSchema = z.object({
  title: z.string().max(80).optional(),
  benefits: z
    .array(
      z.object({
        // Accepts named icon keys ('truck','shield','refresh','star','whatsapp','credit-card')
        // OR any emoji character/string (e.g. '🚚', '🔒').
        icon: z.string().min(1).max(20),
        title: z.string().max(60),
        description: z.string().max(150),
      }),
    )
    .min(2)
    .max(6),
})

export const NewsletterSchema = z.object({
  eyebrow: z.string().max(60).optional(),
  headline: z.string().max(100).default('Únete a la comunidad SAVAYA'),
  subheadline: z.string().max(200).optional(),
  placeholder: z.string().max(60).default('Tu correo electrónico'),
  ctaText: z.string().max(40).default('Suscribirme'),
})

export const SocialProofGridSchema = z.object({
  heading: z.string().max(80).default('SAVAYA EN MOVIMIENTO'),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(150),
        href: z.string().optional(),
      }),
    )
    .min(4)
    .max(8),
})

// ---------------------------------------------------------------------------
// Block type → schema map (used for generic validation in service.ts)
// ---------------------------------------------------------------------------

// banner_row has no stored content — it fetches from the banners table at render time
export const BannerRowSchema = z.object({})

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
  social_proof_grid: SocialProofGridSchema,
  banner_row: BannerRowSchema,
} as const

export type BlockType = keyof typeof BLOCK_SCHEMAS
export type BlockContent<T extends BlockType> = z.infer<(typeof BLOCK_SCHEMAS)[T]>
