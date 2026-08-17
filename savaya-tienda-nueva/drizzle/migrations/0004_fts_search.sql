-- Enable pg_trgm for fuzzy search (typo tolerance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add tsvector column to products for full-text search
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Populate search_vector from name, description, and tags
UPDATE "products" SET "search_vector" =
  to_tsvector('spanish',
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  );

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING GIN ("search_vector");

-- Trigram index on product name for fuzzy matching
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- Trigram index on category name
CREATE INDEX IF NOT EXISTS "categories_name_trgm_idx" ON "categories" USING GIN ("name" gin_trgm_ops);

-- Keep search_vector up-to-date via trigger
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
