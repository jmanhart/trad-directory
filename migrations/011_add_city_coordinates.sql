-- Add latitude and longitude columns to cities table for map view
ALTER TABLE cities ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE cities ADD COLUMN longitude DOUBLE PRECISION;
