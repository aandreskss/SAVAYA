export type Gender = 'women' | 'men' | 'kids' | 'unisex'
export type ProductType = 'clothing' | 'shoes' | 'accessories'
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'on_hold'
export type UserRole = 'customer' | 'admin' | 'sub_admin' | 'editor' | 'gestor_pedidos'
export type DiscountType = 'percentage' | 'fixed'
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'featured'
export type CheckoutStep = 'shipping' | 'method' | 'payment'
export type PaymentMethod = 'zelle' | 'binance' | 'usdt' | 'bank_transfer_ve' | 'pago_movil' | 'efectivo' | 'wholesale_whatsapp'
export type ShippingMethodType = 'standard' | 'express' | 'pickup' | 'cash_on_delivery' | 'delivery'

// ─── Database entities ────────────────────────────────────────────────────────

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  is_active: boolean
  order: number
  created_at: string
}

export interface NavBrand {
  name: string
  slug: string
}

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  gender: Gender | null
  image_url: string | null
  order: number
  product_type?: string | null  // 'clothing' | 'shoes' | 'accessories'
  is_top_level?: boolean
}

export interface NavSubcategory {
  name: string
  slug: string
  product_type: string
}

export interface NavCollection {
  id: string
  name: string
  slug: string
}

export interface NavGenderEntry {
  key: 'mujer'
  label: string
  href: string
  subcategories: NavSubcategory[]
  navCollections: NavCollection[]
  brands: NavBrand[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string
  brand_id?: string | null
  gender: Gender
  type: ProductType
  base_price: number
  sale_price: number | null
  wholesale_price?: number | null
  divisa_price?: number | null
  wholesale_divisa_price?: number | null
  is_new: boolean
  is_featured: boolean
  is_active: boolean
  images: string[]
  tags: string[]
  created_at: string
  // joined
  variants?: ProductVariant[]
  color_images?: ProductColorImages[]
  category?: Category
  brand?: Brand
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string
  color: string
  color_hex: string
  stock: number
  sku: string
}

export interface ProductColorImages {
  id: string
  product_id: string
  color: string
  color_hex: string
  images: string[]
}

export interface Address {
  id: string
  user_id: string
  name: string
  address_line: string
  city: string
  department: string | null
  postal_code: string | null
  phone: string | null
  is_default: boolean
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  email: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  shipping_address: Omit<Address, 'id' | 'user_id' | 'is_default'>
  payment_method: string | null
  payment_id: string | null
  tracking_number: string | null
  notes: string | null
  created_at: string
  // payment proof (submitted by customer)
  payment_proof_url: string | null
  payment_transaction_id: string | null
  payment_date: string | null
  payment_account_holder: string | null
  // shipping (filled by admin)
  shipping_proof_url: string | null
  shipping_notes: string | null
  // joined
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string
  product_name: string
  variant_info: string
  quantity: number
  unit_price: number
  image_url: string | null
}

export interface DiscountCode {
  id: string
  code: string
  type: DiscountType
  value: number
  min_purchase: number | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
}

export interface PopupConfig {
  id: string
  is_active: boolean
  title: string | null
  subtitle: string | null
  body: string | null
  image_url: string | null
  cta_text: string | null
  cta_href: string | null
  discount_code: string | null
  delay_seconds: number
  updated_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  subscribed_at: string
}

export interface PaymentMethodConfig {
  note?: string
  images?: string[]
}

export interface PaymentConfigDB {
  zelle?: { titular?: string; email_phone?: string } & PaymentMethodConfig
  binance?: { pay_id?: string } & PaymentMethodConfig
  usdt?: { address?: string } & PaymentMethodConfig
  bank_transfer_ve?: { banco?: string; tipo?: string; numero?: string; titular?: string; ci?: string; ci_type?: 'ci' | 'rif' } & PaymentMethodConfig
  pago_movil?: { banco?: string; telefono?: string; ci?: string; ci_type?: 'ci' | 'rif' } & PaymentMethodConfig
  efectivo?: PaymentMethodConfig
}

export interface ShippingPrices {
  agency: Record<string, number>   // city → EUR
  delivery: Record<string, number> // Carabobo municipality → EUR
}

export interface StoreSettings {
  id: string
  whatsapp_number: string
  store_email: string
  store_address: string | null
  store_city: string | null
  store_department: string | null
  payment_config: PaymentConfigDB | null
  enabled_payment_methods: string[] | null
  enabled_shipping_companies: string[] | null
  shipping_prices: ShippingPrices | null
  wholesale_min_qty: number | null
  store_currency: string | null
  updated_at: string
}

export interface BannerConfig {
  id: string
  image_url: string | null
  title: string | null
  subtitle: string | null
  badge: string | null
  cta_text: string | null
  href: string | null
  is_active: boolean
  image_only: boolean
  updated_at: string
}

export interface CustomSectionCard {
  id: string
  section_id: string
  label: string
  image_url: string | null
  href: string
  display_order: number
}

export interface CustomSectionData {
  id: string
  slot: number
  title: string | null
  is_active: boolean
  cards: CustomSectionCard[]
}

export interface NavBanners {
  mujer: BannerConfig | null
}

export interface NavBrands {
  brands: NavBrand[]
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  variantId: string
  productId: string
  name: string
  image: string
  price: number
  wholesalePrice?: number
  divisaPrice?: number
  wholesaleDivisaPrice?: number
  size: string
  color: string
  quantity: number
  stock?: number
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface FilterState {
  gender: Gender[]
  type: ProductType[]
  sizes: string[]
  colors: string[]
  minPrice: number | null
  maxPrice: number | null
  isNew: boolean
  onSale: boolean
  sortBy: SortOption
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

export interface ApiError {
  message: string
  code?: string
}
