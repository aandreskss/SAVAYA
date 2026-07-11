import type { ImageLoaderProps } from 'next/image'

/**
 * Next.js custom loader for product/category images (object-cover, 3:4 ratio).
 * Cloudinary crops to 3:4 with AI focal point — prevents cut-off faces/products.
 * Pass this as `loader` prop to <Image>; keep `src` as the original upload URL.
 */
export function cloudinaryCoverLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.includes('res.cloudinary.com')) return src
  const t = ['c_fill', 'g_auto', 'ar_3:4', 'f_auto', `w_${width}`, `q_${quality ?? 75}`]
  return src.replace('/image/upload/', `/image/upload/${t.join(',')}/`)
}

/**
 * Next.js custom loader for the PDP gallery main image (object-contain).
 * Fits within width without cropping so the full product is always visible.
 */
export function cloudinaryContainLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.includes('res.cloudinary.com')) return src
  const t = ['c_fit', 'f_auto', `w_${width}`, `q_${quality ?? 75}`]
  return src.replace('/image/upload/', `/image/upload/${t.join(',')}/`)
}
