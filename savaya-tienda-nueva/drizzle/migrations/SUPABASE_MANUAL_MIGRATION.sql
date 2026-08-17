-- =============================================================
-- SAVAYA TIENDA NUEVA — Migración manual para Supabase SQL Editor
-- Ejecutar este archivo COMPLETO en Supabase > SQL Editor > New query
-- Cubre migraciones 0000–0004 + tabla de tracking de Drizzle
-- =============================================================

-- ====== MIGRACIÓN 0000: Schema principal ======

CREATE TYPE "public"."gender" AS ENUM('women', 'men', 'unisex');
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');
CREATE TYPE "public"."page_section_type" AS ENUM('announcement_bar', 'hero', 'shop_by_category', 'product_carousel', 'editorial_block', 'split_block', 'benefits_block', 'newsletter', 'banner_row');
CREATE TYPE "public"."customer_tag" AS ENUM('new', 'returning', 'vip', 'high_ticket', 'inactive', 'frequent', 'wholesale');
CREATE TYPE "public"."discount_applies_to_type" AS ENUM('all', 'category', 'product', 'collection', 'customer');
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_usd');
CREATE TYPE "public"."exchange_rate_currency" AS ENUM('usd', 'eur');
CREATE TYPE "public"."inventory_movement_type" AS ENUM('purchase', 'sale', 'adjustment', 'return', 'cancellation', 'correction', 'reservation', 'reservation_release');
CREATE TYPE "public"."notification_status" AS ENUM('sent', 'failed', 'skipped');
CREATE TYPE "public"."notification_type" AS ENUM('email', 'whatsapp_link', 'sms');
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'payment_under_review', 'payment_rejected', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE "public"."reservation_payment_type" AS ENUM('full', 'partial_20', 'partial_35', 'partial_50');
CREATE TYPE "public"."payment_currency" AS ENUM('usd', 'ves');
CREATE TYPE "public"."payment_method_type" AS ENUM('zelle', 'pago_movil', 'bank_transfer', 'usdt_trc20', 'binance_pay', 'cash');
CREATE TYPE "public"."proof_status" AS ENUM('pending', 'approved', 'rejected');
CREATE TYPE "public"."role_name" AS ENUM('super_admin', 'admin', 'catalog', 'inventory', 'sales', 'finance', 'customer_service', 'marketing', 'analyst');
CREATE TYPE "public"."shipping_zone_type" AS ENUM('local_delivery', 'national_agency', 'pickup');
CREATE TYPE "public"."wholesale_lead_status" AS ENUM('new', 'contacted', 'qualified', 'disqualified');

CREATE TABLE "order_attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"fbc" text,
	"fbp" text,
	"fbclid" text,
	"gclid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_attributions_order_id_unique" UNIQUE("order_id")
);

CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);

CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);

CREATE TABLE "two_factor_backup_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone
);

CREATE TABLE "two_factor_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"secret" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "two_factor_secrets_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);

CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price_snapshot" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"session_id" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);

CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);

CREATE TABLE "colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hex" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "colors_name_unique" UNIQUE("name")
);

CREATE TABLE "product_collections" (
	"product_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	CONSTRAINT "product_collections_product_id_collection_id_pk" PRIMARY KEY("product_id","collection_id")
);

CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"cloudinary_public_id" text NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"type" "media_type" DEFAULT 'image' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"color_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);

CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"gender" "gender" DEFAULT 'women' NOT NULL,
	"product_type" text DEFAULT 'shoes' NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"tags" text[],
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text,
	"meta_image_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);

CREATE TABLE "sizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sizes_name_unique" UNIQUE("name")
);

CREATE TABLE "wishlist_items" (
	"customer_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_items_customer_id_product_variant_id_pk" PRIMARY KEY("customer_id","product_variant_id")
);

CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"image_desktop_url" text NOT NULL,
	"image_mobile_url" text NOT NULL,
	"cta_text" text,
	"cta_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"type" "page_section_type" NOT NULL,
	"content" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);

CREATE TABLE "popups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"cta_text" text,
	"cta_url" text,
	"delay_seconds" integer DEFAULT 5 NOT NULL,
	"show_on_pages" text[],
	"max_shows_per_session" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"label" text DEFAULT 'casa' NOT NULL,
	"recipient_name" text NOT NULL,
	"state" text NOT NULL,
	"city" text NOT NULL,
	"municipality" text NOT NULL,
	"parish" text,
	"address" text NOT NULL,
	"reference" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "customer_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"author_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "customer_tags" (
	"customer_id" uuid NOT NULL,
	"tag" "customer_tag" NOT NULL,
	CONSTRAINT "customer_tags_customer_id_tag_pk" PRIMARY KEY("customer_id","tag")
);

CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"whatsapp" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent_usd" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_order_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);

CREATE TABLE "coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" "discount_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_order_usd" numeric(10, 2),
	"max_uses_total" integer,
	"max_uses_per_customer" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"applies_to_type" "discount_applies_to_type" DEFAULT 'all' NOT NULL,
	"applies_to_id" uuid,
	"is_first_order_only" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discounts_code_unique" UNIQUE("code")
);

CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" "exchange_rate_currency" NOT NULL,
	"rate_ves" numeric(10, 4) NOT NULL,
	"source" text NOT NULL,
	"is_manual_override" boolean DEFAULT false NOT NULL,
	"override_reason" text,
	"override_by" uuid,
	"fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_variant_id_unique" UNIQUE("variant_id"),
	CONSTRAINT "inventory_quantity_non_negative" CHECK ("inventory"."quantity" >= 0),
	CONSTRAINT "inventory_reserved_non_negative" CHECK ("inventory"."reserved" >= 0),
	CONSTRAINT "inventory_reserved_lte_quantity" CHECK ("inventory"."reserved" <= "inventory"."quantity")
);

CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text,
	"order_id" uuid,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"recipient" text NOT NULL,
	"subject" text,
	"template_id" text NOT NULL,
	"status" "notification_status" NOT NULL,
	"error" text,
	"order_id" uuid,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price_usd" numeric(10, 2) NOT NULL,
	"total_usd" numeric(10, 2) NOT NULL,
	"product_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"subtotal_usd" numeric(10, 2) NOT NULL,
	"discount_usd" numeric(10, 2) DEFAULT '0' NOT NULL,
	"shipping_cost_usd" numeric(10, 2) NOT NULL,
	"total_usd" numeric(10, 2) NOT NULL,
	"exchange_rate_snapshot" numeric(10, 4) NOT NULL,
	"total_bs" numeric(12, 2) NOT NULL,
	"reservation_payment_type" "reservation_payment_type",
	"notes" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key")
);

CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"currency" "payment_currency" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"instructions" text,
	"account_details" jsonb,
	"icon_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "payment_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"currency" "payment_currency" NOT NULL,
	"reference" text NOT NULL,
	"payment_date" date NOT NULL,
	"holder_name" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"cloudinary_url" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"status" "proof_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text
);

CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);

CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "role_name" NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);

CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);

CREATE TABLE "application_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_settings_key_unique" UNIQUE("key")
);

CREATE TABLE "shipping_cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "shipping_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"estimated_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method_id" uuid NOT NULL,
	"city_id" uuid,
	"min_order_usd" numeric(10, 2) DEFAULT '0' NOT NULL,
	"max_order_usd" numeric(10, 2),
	"rate_usd" numeric(10, 2) NOT NULL,
	"free_shipping_threshold_usd" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "shipping_zone_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "wholesale_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"city" text NOT NULL,
	"whatsapp" text NOT NULL,
	"email" text,
	"estimated_monthly_volume" text,
	"message" text,
	"status" "wholesale_lead_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign keys
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "two_factor_backup_codes" ADD CONSTRAINT "two_factor_backup_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "two_factor_secrets" ADD CONSTRAINT "two_factor_secrets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_color_id_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_size_id_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."sizes"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_override_by_users_id_fk" FOREIGN KEY ("override_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "application_settings" ADD CONSTRAINT "application_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "shipping_cities" ADD CONSTRAINT "shipping_cities_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_method_id_shipping_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_city_id_shipping_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."shipping_cities"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes
CREATE INDEX "order_attributions_utm_source_idx" ON "order_attributions" USING btree ("utm_source");
CREATE INDEX "order_attributions_utm_campaign_idx" ON "order_attributions" USING btree ("utm_campaign");
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log" USING btree ("actor_id");
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");
CREATE INDEX "audit_log_resource_type_id_idx" ON "audit_log" USING btree ("resource_type","resource_id");
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" USING btree ("cart_id");
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items" USING btree ("variant_id");
CREATE INDEX "carts_customer_id_idx" ON "carts" USING btree ("customer_id");
CREATE INDEX "carts_session_id_idx" ON "carts" USING btree ("session_id");
CREATE INDEX "carts_expires_at_idx" ON "carts" USING btree ("expires_at");
CREATE INDEX "categories_is_active_idx" ON "categories" USING btree ("is_active");
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");
CREATE INDEX "categories_sort_order_idx" ON "categories" USING btree ("sort_order");
CREATE INDEX "collections_is_active_idx" ON "collections" USING btree ("is_active");
CREATE INDEX "collections_is_featured_idx" ON "collections" USING btree ("is_featured");
CREATE INDEX "collections_starts_at_ends_at_idx" ON "collections" USING btree ("starts_at","ends_at");
CREATE INDEX "product_media_product_id_idx" ON "product_media" USING btree ("product_id");
CREATE INDEX "product_media_variant_id_idx" ON "product_media" USING btree ("variant_id");
CREATE INDEX "product_media_is_primary_idx" ON "product_media" USING btree ("product_id","is_primary");
CREATE UNIQUE INDEX "product_variants_product_color_size_idx" ON "product_variants" USING btree ("product_id","color_id","size_id");
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");
CREATE INDEX "product_variants_is_active_idx" ON "product_variants" USING btree ("is_active");
CREATE INDEX "product_variants_color_id_idx" ON "product_variants" USING btree ("color_id");
CREATE INDEX "product_variants_size_id_idx" ON "product_variants" USING btree ("size_id");
CREATE INDEX "products_is_active_idx" ON "products" USING btree ("is_active");
CREATE INDEX "products_is_featured_idx" ON "products" USING btree ("is_featured");
CREATE INDEX "products_is_new_idx" ON "products" USING btree ("is_new");
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");
CREATE INDEX "products_gender_idx" ON "products" USING btree ("gender");
CREATE INDEX "products_published_at_idx" ON "products" USING btree ("published_at");
CREATE INDEX "banners_is_active_idx" ON "banners" USING btree ("is_active");
CREATE INDEX "banners_starts_at_ends_at_idx" ON "banners" USING btree ("starts_at","ends_at");
CREATE INDEX "banners_sort_order_idx" ON "banners" USING btree ("sort_order");
CREATE INDEX "page_sections_page_id_idx" ON "page_sections" USING btree ("page_id");
CREATE INDEX "page_sections_is_active_sort_idx" ON "page_sections" USING btree ("page_id","is_active","sort_order");
CREATE INDEX "pages_is_active_idx" ON "pages" USING btree ("is_active");
CREATE INDEX "popups_is_active_idx" ON "popups" USING btree ("is_active");
CREATE INDEX "popups_starts_at_ends_at_idx" ON "popups" USING btree ("starts_at","ends_at");
CREATE INDEX "addresses_customer_id_idx" ON "addresses" USING btree ("customer_id");
CREATE INDEX "addresses_is_default_idx" ON "addresses" USING btree ("customer_id","is_default");
CREATE INDEX "customer_notes_customer_id_idx" ON "customer_notes" USING btree ("customer_id");
CREATE INDEX "customers_is_active_idx" ON "customers" USING btree ("is_active");
CREATE INDEX "customers_last_order_at_idx" ON "customers" USING btree ("last_order_at");
CREATE INDEX "customers_total_spent_usd_idx" ON "customers" USING btree ("total_spent_usd");
CREATE INDEX "coupon_usages_discount_id_idx" ON "coupon_usages" USING btree ("discount_id");
CREATE INDEX "coupon_usages_customer_id_idx" ON "coupon_usages" USING btree ("customer_id");
CREATE INDEX "coupon_usages_order_id_idx" ON "coupon_usages" USING btree ("order_id");
CREATE INDEX "discounts_is_active_idx" ON "discounts" USING btree ("is_active");
CREATE INDEX "discounts_starts_at_ends_at_idx" ON "discounts" USING btree ("starts_at","ends_at");
CREATE INDEX "discounts_applies_to_type_id_idx" ON "discounts" USING btree ("applies_to_type","applies_to_id");
CREATE INDEX "exchange_rates_currency_created_at_idx" ON "exchange_rates" USING btree ("currency","created_at");
CREATE INDEX "exchange_rates_is_manual_override_idx" ON "exchange_rates" USING btree ("is_manual_override");
CREATE INDEX "exchange_rates_fetched_at_idx" ON "exchange_rates" USING btree ("fetched_at");
CREATE INDEX "inventory_quantity_idx" ON "inventory" USING btree ("quantity");
CREATE INDEX "inventory_movements_variant_id_idx" ON "inventory_movements" USING btree ("variant_id");
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements" USING btree ("type");
CREATE INDEX "inventory_movements_order_id_idx" ON "inventory_movements" USING btree ("order_id");
CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements" USING btree ("created_at");
CREATE INDEX "notification_log_order_id_idx" ON "notification_log" USING btree ("order_id");
CREATE INDEX "notification_log_customer_id_idx" ON "notification_log" USING btree ("customer_id");
CREATE INDEX "notification_log_status_idx" ON "notification_log" USING btree ("status");
CREATE INDEX "notification_log_created_at_idx" ON "notification_log" USING btree ("created_at");
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");
CREATE INDEX "order_items_variant_id_idx" ON "order_items" USING btree ("variant_id");
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");
CREATE INDEX "order_status_history_created_at_idx" ON "order_status_history" USING btree ("created_at");
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
CREATE INDEX "orders_status_created_at_idx" ON "orders" USING btree ("status","created_at");
CREATE INDEX "payment_methods_is_active_idx" ON "payment_methods" USING btree ("is_active");
CREATE INDEX "payment_methods_sort_order_idx" ON "payment_methods" USING btree ("sort_order");
CREATE INDEX "payment_proofs_order_id_idx" ON "payment_proofs" USING btree ("order_id");
CREATE INDEX "payment_proofs_status_idx" ON "payment_proofs" USING btree ("status");
CREATE INDEX "payment_proofs_created_at_idx" ON "payment_proofs" USING btree ("created_at");
CREATE UNIQUE INDEX "permissions_resource_action_idx" ON "permissions" USING btree ("resource","action");
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");
CREATE INDEX "shipping_cities_zone_id_idx" ON "shipping_cities" USING btree ("zone_id");
CREATE INDEX "shipping_cities_is_active_idx" ON "shipping_cities" USING btree ("is_active");
CREATE INDEX "shipping_cities_state_idx" ON "shipping_cities" USING btree ("state");
CREATE INDEX "shipping_methods_zone_id_idx" ON "shipping_methods" USING btree ("zone_id");
CREATE INDEX "shipping_methods_is_active_idx" ON "shipping_methods" USING btree ("is_active");
CREATE INDEX "shipping_rates_method_id_idx" ON "shipping_rates" USING btree ("method_id");
CREATE INDEX "shipping_rates_city_id_idx" ON "shipping_rates" USING btree ("city_id");
CREATE INDEX "shipping_zones_is_active_idx" ON "shipping_zones" USING btree ("is_active");
CREATE INDEX "shipping_zones_type_idx" ON "shipping_zones" USING btree ("type");
CREATE INDEX "admin_users_is_active_idx" ON "admin_users" USING btree ("is_active");
CREATE INDEX "wholesale_leads_status_idx" ON "wholesale_leads" USING btree ("status");
CREATE INDEX "wholesale_leads_created_at_idx" ON "wholesale_leads" USING btree ("created_at");

-- ====== MIGRACIÓN 0001: FK categoría padre ======

ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;

-- ====== MIGRACIÓN 0002: Campos de checkout y pagos ======

ALTER TABLE "orders" ADD COLUMN "payment_method_id" uuid REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "orders" ADD COLUMN "shipping_snapshot" jsonb;
ALTER TABLE "orders" ADD COLUMN "reserved_until" timestamp with time zone;
ALTER TABLE "payment_proofs" ALTER COLUMN "cloudinary_public_id" DROP NOT NULL;
ALTER TABLE "payment_proofs" ALTER COLUMN "cloudinary_url" DROP NOT NULL;
ALTER TABLE "payment_proofs" ADD COLUMN "metadata" jsonb;
CREATE INDEX "orders_reserved_until_idx" ON "orders" ("reserved_until");
CREATE INDEX "orders_payment_method_id_idx" ON "orders" ("payment_method_id");

-- ====== MIGRACIÓN 0003: Wholesale leads (ya incluido en 0000, se omite) ======
-- wholesale_lead_status ENUM y tabla wholesale_leads ya creados arriba

-- ====== MIGRACIÓN 0004: Full-text search ======

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

UPDATE "products" SET "search_vector" =
  to_tsvector('spanish',
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  );

CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "categories_name_trgm_idx" ON "categories" USING GIN ("name" gin_trgm_ops);

CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_vector_trigger ON "products";
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description, tags
  ON "products"
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- ====== Tabla de tracking de Drizzle ======
-- Permite que drizzle-kit sepa que estas migraciones ya fueron aplicadas

CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT
);

INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES
  ('c259d4c30e5a7bd75142f7e855d2b0aab327945d865805a16698d66f47191731', 1786810358162),
  ('a37bffda2c2c94d5f854c28e61f0747fbcddbcd95626bf0580f8916ade50cd1a', 1786810530463),
  ('f9059c2aef10363b0bbaef4a77a2513f8933219bc8f3316c87d9b52ff96451cd', 1786900000000),
  ('3a76d1d5d5e53319542316073788699238906d180744dc758d6abcfb604a0707', 1786987200000),
  ('4e78b6b9a84e344fab3ff36992b7533bdb610a3b24fb381c028a96fefd15b4f5', 1787000000000);
