-- Fix misspelled state: "Nayarita" → "Nayarit"
UPDATE states SET state_name = 'Nayarit' WHERE id = 73;

-- Fix misspelled city: "Milwakuee" → "Milwaukee"
UPDATE cities SET city_name = 'Milwaukee' WHERE id = 126;
