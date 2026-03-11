-- =============================================================
-- 1. Fix US states missing country_id (United States = id 1)
-- =============================================================
UPDATE states SET country_id = 1 WHERE country_id IS NULL AND state_name IN (
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'D.C.', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
  'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
  'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
);

-- =============================================================
-- 2. Fix Bosnia and Herzegovina missing continent
-- =============================================================
UPDATE countries SET continent = 'Europe' WHERE country_name = 'Bosnia and Herzegovina';

-- =============================================================
-- 3. Add optional country_id to cities table
--    This lets cities link directly to a country without needing
--    a fake state. The mapData API will use this as a fallback
--    when a city has no state.
-- =============================================================
ALTER TABLE cities ADD COLUMN IF NOT EXISTS country_id INT REFERENCES countries(id);

-- =============================================================
-- 4. Backfill country_id on orphan cities (state_id IS NULL)
-- =============================================================

-- Japan (country_id = 17)
UPDATE cities SET country_id = 17 WHERE id IN (84, 230);  -- Osaka, Tokyo

-- South Korea (country_id = 8)
UPDATE cities SET country_id = 8 WHERE id IN (66, 47);    -- Seoul, Bucheon

-- China (country_id = 23)
UPDATE cities SET country_id = 23 WHERE id = 100;          -- Shanghai

-- Colombia (country_id = 7)
UPDATE cities SET country_id = 7 WHERE id IN (46, 149);    -- Bogotá, Medellín

-- Brazil (country_id = 15)
UPDATE cities SET country_id = 15 WHERE id IN (70, 185);   -- Sao Paulo, Montes Claros

-- Argentina (country_id = 41)
UPDATE cities SET country_id = 41 WHERE id IN (220, 184);  -- Buenos Aires, Rosario

-- Chile (country_id = 31)
UPDATE cities SET country_id = 31 WHERE id = 150;          -- Santiago

-- Costa Rica (country_id = 36)
UPDATE cities SET country_id = 36 WHERE id = 157;          -- Heredia

-- United Kingdom (country_id = 3)
UPDATE cities SET country_id = 3 WHERE id IN (
  106, 139, 117, 103, 189, 210, 137, 225, 188, 232,
  96, 216, 203, 164, 138, 163, 123, 50, 242, 202
);
-- London, Brighton, Cambridgeshire, Chester, Chelmsford, Colchester,
-- Eastbourne, Exeter, Kingston upon Hull, Leeds, Newcastle, Newcastle,
-- Norwich, Nottingham, Plymouth, Portsmouth, Shrewsbury, Whitley Bay,
-- Barnstaple, Worcester

-- Germany (country_id = 29)
UPDATE cities SET country_id = 29 WHERE id IN (1, 251, 246);   -- Berlin, Frankfurt, Hamburg

-- France (country_id = 30)
UPDATE cities SET country_id = 30 WHERE id IN (141, 213, 233); -- Paris, Nantes, Metz

-- Italy (country_id = 27)
UPDATE cities SET country_id = 27 WHERE id IN (120, 208, 221, 222, 243); -- Catania, Florence, Ladispoli, Rome, Turin

-- Spain (country_id = 5)
UPDATE cities SET country_id = 5 WHERE id IN (212, 177, 199);  -- Albacete, Granada, Valencia

-- Ireland (country_id = 26)
UPDATE cities SET country_id = 26 WHERE id = 119;              -- Dublin

-- Netherlands (country_id = 51)
UPDATE cities SET country_id = 51 WHERE id = 206;              -- Maastricht

-- Belgium (country_id = 40)
UPDATE cities SET country_id = 40 WHERE id = 181;              -- Antwerp

-- Sweden (country_id = 11)
UPDATE cities SET country_id = 11 WHERE id IN (63, 179);       -- Stockholm, Jönköping

-- Norway (country_id = 12)
UPDATE cities SET country_id = 12 WHERE id IN (64, 156);       -- Oslo, Sandefjord

-- Denmark (country_id = 39)
UPDATE cities SET country_id = 39 WHERE id = 180;              -- Copenhagen

-- Finland (country_id = 28)
UPDATE cities SET country_id = 28 WHERE id = 121;              -- Imatra

-- Austria (country_id = 9)
UPDATE cities SET country_id = 9 WHERE id = 49;                -- Vienna

-- Poland (country_id = 20)
UPDATE cities SET country_id = 20 WHERE id = 89;               -- Warsaw

-- Estonia (country_id = 38)
UPDATE cities SET country_id = 38 WHERE id = 178;              -- Tallinn

-- Iceland (country_id = 37)
UPDATE cities SET country_id = 37 WHERE id = 168;              -- Reykjavik

-- Ukraine (country_id = 14)
UPDATE cities SET country_id = 14 WHERE id = 69;               -- Kyiv

-- Russia (country_id = 42)
UPDATE cities SET country_id = 42 WHERE id = 187;              -- Saint Petersburg

-- Croatia (country_id = 34)
UPDATE cities SET country_id = 34 WHERE id IN (152, 153);      -- Rijeka, Matulji

-- Bosnia and Herzegovina (country_id = 52)
UPDATE cities SET country_id = 52 WHERE id = 238;              -- Banja Luka

-- New Zealand (country_id = 18)
UPDATE cities SET country_id = 18 WHERE id = 87;               -- Auckland

-- Australia (country_id = 4)
UPDATE cities SET country_id = 4 WHERE id IN (197, 196, 183);  -- Lennox Head, Ballarat, Sydney

-- Mexico (country_id = 10)
UPDATE cities SET country_id = 10 WHERE id = 142;              -- Mexicali

-- Canada (country_id = 2)
UPDATE cities SET country_id = 2 WHERE id IN (182, 143);       -- Kelowna, Manitoba

-- United States (country_id = 1)
UPDATE cities SET country_id = 1 WHERE id IN (136, 247);       -- New Castle, Bakersfield
