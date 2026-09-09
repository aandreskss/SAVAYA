-- Migration: category gender + dynamic nav_items table
-- Run manually in Supabase SQL editor (same as 0008)

-- 1. Add gender column to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "gender" TEXT NOT NULL DEFAULT 'unisex';

-- 2. Create nav_items table for dynamic navbar configuration
CREATE TABLE IF NOT EXISTS "nav_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "label" TEXT NOT NULL,
  "href" TEXT,
  "type" TEXT NOT NULL DEFAULT 'link',
  "gender" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "nav_items_is_active_idx" ON "nav_items" ("is_active");
CREATE INDEX IF NOT EXISTS "nav_items_sort_order_idx" ON "nav_items" ("sort_order");

-- 3. Seed default nav items
INSERT INTO "nav_items" ("label", "href", "type", "gender", "sort_order", "is_active") VALUES
  ('Mujer',   '/mujer',   'category_group', 'mujer',  1, true),
  ('Hombre',  '/hombre',  'category_group', 'hombre', 2, true),
  ('Nuevos',  '/nuevos',  'link',           NULL,     3, true),
  ('Ofertas', '/ofertas', 'link',           NULL,     4, true);
