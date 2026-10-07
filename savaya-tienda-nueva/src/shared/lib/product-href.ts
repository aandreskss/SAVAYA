/** Canonical URL for a product based on its gender. Unisex products keep /producto/[slug]. */
export function productHref(gender: string, slug: string): string {
  return gender && gender !== 'unisex'
    ? `/${gender}/producto/${slug}`
    : `/producto/${slug}`
}
