-- Migration: VIP products + smart collections + fix draft products visibility
-- Run via: drizzle-kit push (or apply manually in Supabase SQL editor)

-- 1. Add is_vip flag to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_vip" boolean DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS "products_is_vip_idx" ON "products" ("is_vip");

-- 2. Add filter_rules (JSONB) to collections for smart/automatic collections
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "filter_rules" jsonb DEFAULT NULL;

-- 3. Fix draft visibility: set published_at for all active products that don't have one
--    These were previously visible due to the (IS NULL OR <= NOW()) condition.
--    After this fix, published_at IS NOT NULL is required for storefront visibility.
UPDATE "products"
SET "published_at" = NOW()
WHERE "is_active" = true AND "published_at" IS NULL;
