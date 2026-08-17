import { db } from '@/shared/lib/db'
import { customers, addresses } from './schema'
import { wishlistItems } from '@/domains/catalog/schema'
import { products, productVariants, productMedia, colors, sizes } from '@/domains/catalog/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { CustomerProfile, CustomerAddress, WishlistProduct } from './types'

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export async function getCustomerByEmail(
  email: string,
): Promise<CustomerProfile | null> {
  const rows = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      whatsapp: customers.whatsapp,
      totalOrders: customers.totalOrders,
      totalSpentUsd: customers.totalSpentUsd,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1)
  return rows[0] ?? null
}

export async function getCustomerById(
  id: string,
): Promise<CustomerProfile | null> {
  const rows = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      whatsapp: customers.whatsapp,
      totalOrders: customers.totalOrders,
      totalSpentUsd: customers.totalSpentUsd,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1)
  return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export async function getCustomerAddresses(
  customerId: string,
): Promise<CustomerAddress[]> {
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.customerId, customerId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt))
}

export async function getAddressByIdAndCustomer(
  addressId: string,
  customerId: string,
): Promise<CustomerAddress | null> {
  const rows = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.customerId, customerId)))
    .limit(1)
  return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export async function getWishlistProducts(
  customerId: string,
): Promise<WishlistProduct[]> {
  const rows = await db
    .select({
      variantId: wishlistItems.productVariantId,
      productSlug: products.slug,
      productName: products.name,
      colorName: colors.name,
      sizeName: sizes.name,
      priceUsd: productVariants.price,
      compareAtPriceUsd: productVariants.compareAtPrice,
      imageUrl: productMedia.url,
      isVariantActive: productVariants.isActive,
      isProductActive: products.isActive,
      addedAt: wishlistItems.createdAt,
    })
    .from(wishlistItems)
    .innerJoin(productVariants, eq(productVariants.id, wishlistItems.productVariantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(
      productMedia,
      and(
        eq(productMedia.productId, products.id),
        eq(productMedia.isPrimary, true),
      ),
    )
    .where(eq(wishlistItems.customerId, customerId))
    .orderBy(desc(wishlistItems.createdAt))

  return rows.map((r) => ({
    variantId: r.variantId,
    productSlug: r.productSlug,
    productName: r.productName,
    colorName: r.colorName,
    sizeName: r.sizeName,
    priceUsd: r.priceUsd,
    compareAtPriceUsd: r.compareAtPriceUsd,
    imageUrl: r.imageUrl ?? null,
    isAvailable: r.isVariantActive && r.isProductActive,
    addedAt: r.addedAt,
  }))
}
