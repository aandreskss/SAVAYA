// ─── Price ────────────────────────────────────────────────────────────────────

export function formatPrice(price: number, currency = 'EUR'): string {
  if (currency === 'BS') {
    return `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}`
  }
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export function getDiscountPercentage(basePrice: number, salePrice: number): number {
  return Math.round(((basePrice - salePrice) / basePrice) * 100)
}

// ─── Slugs ────────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Generates a slug guaranteed to be unique by appending a short random id. */
export function slugifyUnique(text: string): string {
  const base = slugify(text)
  const id = Math.random().toString(36).slice(2, 7)
  return `${base}-${id}`
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(Math.random() * 99_999)
    .toString()
    .padStart(5, '0')
  return `TUL-${year}-${seq}`
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export function isInStock(stock: number): boolean {
  return stock > 0
}

export function isLowStock(stock: number, threshold = 5): boolean {
  return stock > 0 && stock <= threshold
}

// ─── Text ─────────────────────────────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

// ─── Classes ──────────────────────────────────────────────────────────────────

/** Merges class strings, filtering out falsy values. */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ─── Media proxy ──────────────────────────────────────────────────────────────

/**
 * Converts a Cloudinary URL to a proxy URL served from the app's own domain.
 * The rewrite rule in vercel.json maps /imagenes/* → Cloudinary.
 * Pass absolute=true (default) to get a full URL for WhatsApp messages.
 */
export function toProxyUrl(cloudinaryUrl: string, absolute = true): string {
  const base = absolute ? (process.env.NEXT_PUBLIC_APP_URL ?? '') : ''
  return cloudinaryUrl.replace(
    /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//,
    `${base}/imagenes/`,
  )
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}
