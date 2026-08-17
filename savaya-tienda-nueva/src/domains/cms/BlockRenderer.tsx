import type { ParsedBlock } from './service'
import type { BlockContent } from './block-schemas'
import { AnnouncementBar } from './blocks/AnnouncementBar'
import { Hero } from './blocks/Hero'
import { ShopByCategory } from './blocks/ShopByCategory'
import { ProductCarousel } from './blocks/ProductCarousel'
import { EditorialBlock } from './blocks/EditorialBlock'
import { SplitBlock } from './blocks/SplitBlock'
import { BenefitsBlock } from './blocks/BenefitsBlock'
import { Newsletter } from './blocks/Newsletter'
import { PromoBanner } from './blocks/PromoBanner'
import { getProducts } from '@/domains/catalog/repository'
import type { ProductCardProps } from '@/shared/ui'

type Props = {
  block: ParsedBlock
}

async function fetchCarouselProducts(
  content: BlockContent<'product_carousel'>,
): Promise<ProductCardProps[]> {
  try {
    const { items } = await getProducts({
      onlyNew: content.source === 'new',
      sortBy:
        content.source === 'bestseller'
          ? 'bestseller'
          : content.source === 'featured'
            ? 'featured'
            : 'newest',
      collectionSlug: content.source === 'collection' ? content.collectionSlug : undefined,
      onlyAvailable: true,
      limit: content.limit,
    })

    return items.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      availableColors: p.availableColors,
      badges: p.isNew ? (['new'] as const) : p.compareAtPrice ? (['sale'] as const) : undefined,
    }))
  } catch {
    return []
  }
}

export async function BlockRenderer({ block }: Props) {
  switch (block.type) {
    case 'announcement_bar':
      return <AnnouncementBar {...(block.content as BlockContent<'announcement_bar'>)} />

    case 'hero':
      return <Hero {...(block.content as BlockContent<'hero'>)} />

    case 'shop_by_category':
      return <ShopByCategory {...(block.content as BlockContent<'shop_by_category'>)} />

    case 'product_carousel': {
      const content = block.content as BlockContent<'product_carousel'>
      const products = await fetchCarouselProducts(content)
      return <ProductCarousel {...content} products={products} />
    }

    case 'split_block':
      return <SplitBlock {...(block.content as BlockContent<'split_block'>)} />

    case 'editorial_block':
      return <EditorialBlock {...(block.content as BlockContent<'editorial_block'>)} />

    case 'benefits_block':
      return <BenefitsBlock {...(block.content as BlockContent<'benefits_block'>)} />

    case 'newsletter':
      return <Newsletter {...(block.content as BlockContent<'newsletter'>)} />

    case 'promo_banner':
      return <PromoBanner {...(block.content as BlockContent<'promo_banner'>)} />

    default:
      return null
  }
}
