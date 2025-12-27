-- Fix Moon Phase Duplicate Entries
-- Run this in your Supabase SQL Editor

-- Step 1: Delete duplicate entries, keeping only the most recent one for each date+country
DELETE FROM moon_phase a
USING moon_phase b
WHERE a.id < b.id
  AND a.date = b.date
  AND a.country_name = b.country_name;

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE moon_phase
  DROP CONSTRAINT IF EXISTS moon_phase_date_country_unique;

ALTER TABLE moon_phase
  ADD CONSTRAINT moon_phase_date_country_unique 
  UNIQUE (date, country_name);

-- Step 3: Verify the fix
SELECT date, country_name, COUNT(*) as count
FROM moon_phase
GROUP BY date, country_name
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Step 4: Check total rows
SELECT COUNT(*) as total_rows FROM moon_phase;
