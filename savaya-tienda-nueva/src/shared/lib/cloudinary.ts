// Cloudinary transformation helpers.
// All image URLs in the app should go through these helpers so transforms
// are applied consistently and never duplicated per-component.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`

type TransformOptions = {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'avif'
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad'
  gravity?: 'auto' | 'face' | 'center'
  blur?: number
}

function buildTransform(opts: TransformOptions): string {
  const parts: string[] = []
  if (opts.format !== undefined) parts.push(`f_${opts.format}`)
  if (opts.quality !== undefined) parts.push(`q_${opts.quality}`)
  if (opts.crop) parts.push(`c_${opts.crop}`)
  if (opts.gravity) parts.push(`g_${opts.gravity}`)
  if (opts.width) parts.push(`w_${opts.width}`)
  if (opts.height) parts.push(`h_${opts.height}`)
  if (opts.blur) parts.push(`e_blur:${opts.blur}`)
  return parts.join(',')
}

// Returns a Cloudinary URL with transforms applied.
// publicId is the Cloudinary public_id (e.g. "savaya/products/abc123")
export function cloudinaryUrl(publicId: string, opts: TransformOptions = {}): string {
  if (!CLOUD_NAME || !publicId) return publicId
  const transform = buildTransform({ format: 'auto', quality: 80, ...opts })
  return `${BASE}/${transform}/${publicId}`
}

// Returns a tiny blurred placeholder for progressive loading.
export function cloudinaryBlurPlaceholder(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 20, quality: 30, blur: 500 })
}

// Pre-configured sizes for common use cases
export const cloudinaryPresets = {
  productCard: (publicId: string) =>
    cloudinaryUrl(publicId, { width: 600, crop: 'fill', gravity: 'auto' }),

  productGallery: (publicId: string, width = 900) =>
    cloudinaryUrl(publicId, { width, crop: 'fill', gravity: 'center' }),

  thumbnail: (publicId: string) =>
    cloudinaryUrl(publicId, { width: 120, height: 120, crop: 'fill', gravity: 'auto' }),

  heroBanner: (publicId: string) =>
    cloudinaryUrl(publicId, { width: 1920, crop: 'fill', gravity: 'auto', quality: 70 }),

  categoryCard: (publicId: string) =>
    cloudinaryUrl(publicId, { width: 400, height: 400, crop: 'fill', gravity: 'auto' }),
}

// Generates a signed upload signature via server-side route.
// Client calls this before uploading to Cloudinary directly.
export async function getUploadSignature(folder: string): Promise<{
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
}> {
  const res = await fetch(`/api/admin/catalog/upload-signature?folder=${encodeURIComponent(folder)}`)
  if (!res.ok) throw new Error('No se pudo obtener la firma de upload')
  return res.json()
}
