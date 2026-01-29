-- Migration: Add slug columns to artists and tattoo_shops tables
-- This migration adds slug columns, creates indexes, and generates slugs for existing records

-- Add slug column to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Add slug column to tattoo_shops table
ALTER TABLE tattoo_shops 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create indexes for slug columns (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_tattoo_shops_slug ON tattoo_shops(slug);

-- Function to generate a slug from a name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique slug for artists (appends ID if duplicate)
CREATE OR REPLACE FUNCTION generate_unique_artist_slug(name TEXT, id BIGINT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  base_slug := generate_slug(name);
  
  -- Check if base slug already exists (excluding current record)
  IF EXISTS (SELECT 1 FROM artists WHERE slug = base_slug AND artists.id != generate_unique_artist_slug.id) THEN
    final_slug := base_slug || '-' || id::TEXT;
  ELSE
    final_slug := base_slug;
  END IF;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique slug for shops (appends ID if duplicate)
CREATE OR REPLACE FUNCTION generate_unique_shop_slug(name TEXT, id BIGINT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  base_slug := generate_slug(name);
  
  -- Check if base slug already exists (excluding current record)
  IF EXISTS (SELECT 1 FROM tattoo_shops WHERE slug = base_slug AND tattoo_shops.id != generate_unique_shop_slug.id) THEN
    final_slug := base_slug || '-' || id::TEXT;
  ELSE
    final_slug := base_slug;
  END IF;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing artists
UPDATE artists
SET slug = generate_unique_artist_slug(name, id)
WHERE slug IS NULL OR slug = '';

-- Generate slugs for existing shops
UPDATE tattoo_shops
SET slug = generate_unique_shop_slug(shop_name, id)
WHERE slug IS NULL OR slug = '';

-- Add NOT NULL constraint after populating (optional, can be done later)
-- ALTER TABLE artists ALTER COLUMN slug SET NOT NULL;
-- ALTER TABLE tattoo_shops ALTER COLUMN slug SET NOT NULL;
