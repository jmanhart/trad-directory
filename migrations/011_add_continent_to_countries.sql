-- Add continent column to countries table
ALTER TABLE countries ADD COLUMN continent TEXT;

-- Backfill existing countries with correct continent values
UPDATE countries SET continent = 'North America' WHERE country_name IN ('United States', 'Canada', 'Mexico');
UPDATE countries SET continent = 'Central America' WHERE country_name IN ('Costa Rica', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Panama', 'Belize');
UPDATE countries SET continent = 'South America' WHERE country_name IN ('Colombia', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Ecuador', 'Venezuela', 'Uruguay', 'Paraguay', 'Bolivia');
UPDATE countries SET continent = 'Europe' WHERE country_name IN ('United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Portugal', 'Ireland', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Austria', 'Poland', 'Czech Republic', 'Greece', 'Finland', 'Russia', 'Hungary', 'Romania', 'Croatia', 'Serbia', 'Bulgaria', 'Slovakia', 'Slovenia', 'Lithuania', 'Latvia', 'Estonia', 'Iceland', 'Luxembourg', 'Malta', 'Cyprus', 'Ukraine');
UPDATE countries SET continent = 'Asia' WHERE country_name IN ('Japan', 'South Korea', 'Thailand', 'China', 'Taiwan', 'Philippines', 'Indonesia', 'Singapore', 'Vietnam', 'India', 'Malaysia', 'Cambodia', 'Myanmar', 'Nepal', 'Sri Lanka', 'Pakistan', 'Bangladesh', 'Hong Kong', 'Macau', 'Israel', 'Turkey', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon');
UPDATE countries SET continent = 'Oceania' WHERE country_name IN ('Australia', 'New Zealand', 'Fiji', 'Papua New Guinea');
UPDATE countries SET continent = 'Africa' WHERE country_name IN ('South Africa', 'Morocco', 'Egypt', 'Nigeria', 'Kenya', 'Ghana', 'Tanzania', 'Ethiopia');
