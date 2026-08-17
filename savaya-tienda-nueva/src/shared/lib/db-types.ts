/**
 * Inferred TypeScript types from Drizzle schemas.
 * Never define these manually — always use InferSelectModel / InferInsertModel
 * to keep types in sync with the DB schema automatically.
 */
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

// Auth
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  twoFactorSecrets,
  twoFactorBackupCodes,
} from '@/domains/auth/schema'

// Users
import { adminUsers } from '@/domains/users/schema'

// Roles & Permissions
import { roles, permissions, rolePermissions, userRoles } from '@/domains/roles-permissions/schema'

// Customers
import {
  customers,
  addresses,
  customerNotes,
  customerTags,
} from '@/domains/customers/schema'

// Catalog
import {
  categories,
  collections,
  colors,
  sizes,
  products,
  productVariants,
  productMedia,
  productCollections,
  wishlistItems,
} from '@/domains/catalog/schema'

// Inventory
import { inventory, inventoryMovements } from '@/domains/inventory/schema'

// Cart
import { carts, cartItems } from '@/domains/cart/schema'

// Orders
import { orders, orderItems, orderStatusHistory } from '@/domains/orders/schema'

// Payment Methods
import { paymentMethods } from '@/domains/payment-methods/schema'

// Payment Proofs
import { paymentProofs } from '@/domains/payment-proofs/schema'

// Shipping
import {
  shippingZones,
  shippingCities,
  shippingMethods,
  shippingRates,
} from '@/domains/shipping/schema'

// Discounts & Promotions
import { discounts, couponUsages } from '@/domains/discounts-promotions/schema'

// CMS
import { pages, pageSections, banners, popups } from '@/domains/cms/schema'

// Exchange Rates
import { exchangeRates } from '@/domains/exchange-rates/schema'

// Analytics
import { orderAttributions } from '@/domains/analytics/schema'

// Settings
import { applicationSettings } from '@/domains/settings/schema'

// Audit Log
import { auditLog } from '@/domains/audit-log/schema'

// Notifications
import { notificationLog } from '@/domains/notifications/schema'

// Wholesale
import { wholesaleLeads } from '@/domains/wholesale/schema'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Account = InferSelectModel<typeof accounts>
export type NewAccount = InferInsertModel<typeof accounts>

export type Session = InferSelectModel<typeof sessions>
export type NewSession = InferInsertModel<typeof sessions>

export type VerificationToken = InferSelectModel<typeof verificationTokens>
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>

export type TwoFactorSecret = InferSelectModel<typeof twoFactorSecrets>
export type NewTwoFactorSecret = InferInsertModel<typeof twoFactorSecrets>

export type TwoFactorBackupCode = InferSelectModel<typeof twoFactorBackupCodes>
export type NewTwoFactorBackupCode = InferInsertModel<typeof twoFactorBackupCodes>

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export type AdminUser = InferSelectModel<typeof adminUsers>
export type NewAdminUser = InferInsertModel<typeof adminUsers>

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------
export type Role = InferSelectModel<typeof roles>
export type NewRole = InferInsertModel<typeof roles>

export type Permission = InferSelectModel<typeof permissions>
export type NewPermission = InferInsertModel<typeof permissions>

export type RolePermission = InferSelectModel<typeof rolePermissions>
export type NewRolePermission = InferInsertModel<typeof rolePermissions>

export type UserRole = InferSelectModel<typeof userRoles>
export type NewUserRole = InferInsertModel<typeof userRoles>

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export type Customer = InferSelectModel<typeof customers>
export type NewCustomer = InferInsertModel<typeof customers>

export type Address = InferSelectModel<typeof addresses>
export type NewAddress = InferInsertModel<typeof addresses>

export type CustomerNote = InferSelectModel<typeof customerNotes>
export type NewCustomerNote = InferInsertModel<typeof customerNotes>

export type CustomerTag = InferSelectModel<typeof customerTags>
export type NewCustomerTag = InferInsertModel<typeof customerTags>

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
export type Category = InferSelectModel<typeof categories>
export type NewCategory = InferInsertModel<typeof categories>

export type Collection = InferSelectModel<typeof collections>
export type NewCollection = InferInsertModel<typeof collections>

export type Color = InferSelectModel<typeof colors>
export type NewColor = InferInsertModel<typeof colors>

export type Size = InferSelectModel<typeof sizes>
export type NewSize = InferInsertModel<typeof sizes>

export type Product = InferSelectModel<typeof products>
export type NewProduct = InferInsertModel<typeof products>

export type ProductVariant = InferSelectModel<typeof productVariants>
export type NewProductVariant = InferInsertModel<typeof productVariants>

export type ProductMedia = InferSelectModel<typeof productMedia>
export type NewProductMedia = InferInsertModel<typeof productMedia>

export type ProductCollection = InferSelectModel<typeof productCollections>
export type NewProductCollection = InferInsertModel<typeof productCollections>

export type WishlistItem = InferSelectModel<typeof wishlistItems>
export type NewWishlistItem = InferInsertModel<typeof wishlistItems>

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------
export type Inventory = InferSelectModel<typeof inventory>
export type NewInventory = InferInsertModel<typeof inventory>

export type InventoryMovement = InferSelectModel<typeof inventoryMovements>
export type NewInventoryMovement = InferInsertModel<typeof inventoryMovements>

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export type Cart = InferSelectModel<typeof carts>
export type NewCart = InferInsertModel<typeof carts>

export type CartItem = InferSelectModel<typeof cartItems>
export type NewCartItem = InferInsertModel<typeof cartItems>

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export type Order = InferSelectModel<typeof orders>
export type NewOrder = InferInsertModel<typeof orders>

export type OrderItem = InferSelectModel<typeof orderItems>
export type NewOrderItem = InferInsertModel<typeof orderItems>

export type OrderStatusHistory = InferSelectModel<typeof orderStatusHistory>
export type NewOrderStatusHistory = InferInsertModel<typeof orderStatusHistory>

// ---------------------------------------------------------------------------
// Payment Methods
// ---------------------------------------------------------------------------
export type PaymentMethod = InferSelectModel<typeof paymentMethods>
export type NewPaymentMethod = InferInsertModel<typeof paymentMethods>

// ---------------------------------------------------------------------------
// Payment Proofs
// ---------------------------------------------------------------------------
export type PaymentProof = InferSelectModel<typeof paymentProofs>
export type NewPaymentProof = InferInsertModel<typeof paymentProofs>

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------
export type ShippingZone = InferSelectModel<typeof shippingZones>
export type NewShippingZone = InferInsertModel<typeof shippingZones>

export type ShippingCity = InferSelectModel<typeof shippingCities>
export type NewShippingCity = InferInsertModel<typeof shippingCities>

export type ShippingMethod = InferSelectModel<typeof shippingMethods>
export type NewShippingMethod = InferInsertModel<typeof shippingMethods>

export type ShippingRate = InferSelectModel<typeof shippingRates>
export type NewShippingRate = InferInsertModel<typeof shippingRates>

// ---------------------------------------------------------------------------
// Discounts & Promotions
// ---------------------------------------------------------------------------
export type Discount = InferSelectModel<typeof discounts>
export type NewDiscount = InferInsertModel<typeof discounts>

export type CouponUsage = InferSelectModel<typeof couponUsages>
export type NewCouponUsage = InferInsertModel<typeof couponUsages>

// ---------------------------------------------------------------------------
// CMS
// ---------------------------------------------------------------------------
export type Page = InferSelectModel<typeof pages>
export type NewPage = InferInsertModel<typeof pages>

export type PageSection = InferSelectModel<typeof pageSections>
export type NewPageSection = InferInsertModel<typeof pageSections>

export type Banner = InferSelectModel<typeof banners>
export type NewBanner = InferInsertModel<typeof banners>

export type Popup = InferSelectModel<typeof popups>
export type NewPopup = InferInsertModel<typeof popups>

// ---------------------------------------------------------------------------
// Exchange Rates
// ---------------------------------------------------------------------------
export type ExchangeRate = InferSelectModel<typeof exchangeRates>
export type NewExchangeRate = InferInsertModel<typeof exchangeRates>

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export type OrderAttribution = InferSelectModel<typeof orderAttributions>
export type NewOrderAttribution = InferInsertModel<typeof orderAttributions>

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export type ApplicationSetting = InferSelectModel<typeof applicationSettings>
export type NewApplicationSetting = InferInsertModel<typeof applicationSettings>

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------
export type AuditLog = InferSelectModel<typeof auditLog>
export type NewAuditLog = InferInsertModel<typeof auditLog>

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export type NotificationLog = InferSelectModel<typeof notificationLog>
export type NewNotificationLog = InferInsertModel<typeof notificationLog>

// ---------------------------------------------------------------------------
// Wholesale
// ---------------------------------------------------------------------------
export type WholesaleLead = InferSelectModel<typeof wholesaleLeads>
export type NewWholesaleLead = InferInsertModel<typeof wholesaleLeads>
