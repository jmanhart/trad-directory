-- Shop map pins: add lat/lng to tattoo_shops + backfill Seattle & Portland shops.
--
-- Coordinates were geocoded from each shop's street `address` via OpenStreetMap
-- Nominatim and verified against the returned display name. Additive and safe:
-- the columns are nullable, so shops outside this first batch simply stay null
-- (they don't render a pin) until backfilled. Full backfill of the remaining
-- ~288 shops is a follow-up.
--
-- Rollback: alter table public.tattoo_shops drop column latitude, drop column longitude;

ALTER TABLE public.tattoo_shops ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.tattoo_shops ADD COLUMN IF NOT EXISTS longitude double precision;

-- Seattle, WA
UPDATE public.tattoo_shops SET latitude=47.6513877, longitude=-122.351597  WHERE id=2;   -- 36th Street Tattoo
UPDATE public.tattoo_shops SET latitude=47.56124,    longitude=-122.3873608 WHERE id=57;  -- Alaska Street Tattoo Parlour
UPDATE public.tattoo_shops SET latitude=47.6685062, longitude=-122.3863541 WHERE id=43;  -- Anchor Tattoo
UPDATE public.tattoo_shops SET latitude=47.5574985, longitude=-122.284667  WHERE id=161; -- Electric Cobra Tattoo
UPDATE public.tattoo_shops SET latitude=47.6172819, longitude=-122.3489694 WHERE id=1;   -- Liberty Tattoo
UPDATE public.tattoo_shops SET latitude=47.6136175, longitude=-122.3196344 WHERE id=41;  -- Supergenius Tattoo

-- Portland, OR
UPDATE public.tattoo_shops SET latitude=45.5561112, longitude=-122.6751289 WHERE id=269; -- Atlas Tattoo
UPDATE public.tattoo_shops SET latitude=45.5514758, longitude=-122.6668855 WHERE id=261; -- BIGTIME Tattoo
UPDATE public.tattoo_shops SET latitude=45.53519,   longitude=-122.641011  WHERE id=25;  -- Blacklist Tattoo
UPDATE public.tattoo_shops SET latitude=45.5518634, longitude=-122.6753914 WHERE id=271; -- Fare Well Tattoo
UPDATE public.tattoo_shops SET latitude=45.5410932, longitude=-122.6750395 WHERE id=309; -- Icon Tattoo
UPDATE public.tattoo_shops SET latitude=45.5593127, longitude=-122.6408165 WHERE id=270; -- Jaguar Tattoo
UPDATE public.tattoo_shops SET latitude=45.5921371, longitude=-122.7564669 WHERE id=16;  -- Lombard Street Tattoo Parlour
UPDATE public.tattoo_shops SET latitude=45.5896041, longitude=-122.7533513 WHERE id=272; -- Sunshine Tattoo
UPDATE public.tattoo_shops SET latitude=45.5051642, longitude=-122.6106763 WHERE id=82;  -- Tattoo DeGink
UPDATE public.tattoo_shops SET latitude=45.5083467, longitude=-122.6486115 WHERE id=108; -- Tattoo Smile PDX

-- Portland, ME (collision check: geocoded to Maine from its own address)
UPDATE public.tattoo_shops SET latitude=43.6569804, longitude=-70.2515305  WHERE id=89;  -- Gold Star Tattoo
