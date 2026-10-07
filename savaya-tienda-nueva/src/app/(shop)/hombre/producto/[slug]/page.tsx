import { getProductBySlug } from '@/domains/catalog/repository'
import { productHref } from '@/shared/lib/product-href'
import { GenericProductPage } from '@/domains/catalog/components/GenericProductPage'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  const canonical = productHref(product.gender, product.slug)

  return {
    title: product.seoTitle ?? `${product.name} — SAVAYA`,
    description:
      product.seoDescription ?? `Compra ${product.name} en SAVAYA. Calzado venezolano de calidad.`,
    alternates: { canonical: `${BASE_URL}${canonical}` },
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      images: product.images[0] ? [product.images[0].url] : [],
    },
  }
}

export default async function HombreProductPage({ params }: Props) {
  const { slug } = await params
  return <GenericProductPage slug={slug} genderContext="hombre" />
}
