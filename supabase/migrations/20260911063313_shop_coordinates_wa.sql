-- Shop map pins: backfill the remaining Washington shops (non-Seattle).
-- Coordinates geocoded from each shop's street address via Nominatim and
-- verified against the returned place. Columns were added in the prior
-- migration (20260911060121_shop_coordinates). Oregon is already complete
-- (all its shops were the Portland batch).

UPDATE public.tattoo_shops SET latitude=47.6613184, longitude=-117.4265976 WHERE id=274; -- Iron & Gold Tattoo (Spokane)
UPDATE public.tattoo_shops SET latitude=47.5667863, longitude=-122.6266138 WHERE id=289; -- Homeport Tattoo (Bremerton)
UPDATE public.tattoo_shops SET latitude=48.5165125, longitude=-122.6120744 WHERE id=42;  -- 7th Street Tattoo (Anacortes)
UPDATE public.tattoo_shops SET latitude=47.0473682, longitude=-122.8363583 WHERE id=44;  -- Bulldog Tattoo Parlor (Olympia)
UPDATE public.tattoo_shops SET latitude=47.0454051, longitude=-122.9019541 WHERE id=40;  -- Electric Rose Tattoo (Olympia)
