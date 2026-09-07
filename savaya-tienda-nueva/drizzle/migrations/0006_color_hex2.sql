-- Add second hex color for bicolor/combined color variants
ALTER TABLE colors ADD COLUMN IF NOT EXISTS hex2 text;
