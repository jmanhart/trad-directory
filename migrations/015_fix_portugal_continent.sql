-- Fix Portugal missing continent value
UPDATE countries SET continent = 'Europe' WHERE country_name = 'Portugal' AND continent IS NULL;

-- Fix any other countries with missing continent values
-- (add more rows here as needed after checking the database)
