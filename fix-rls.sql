-- Quick Fix for Row Level Security on memorized_surahs
-- Run this in your Supabase SQL Editor to fix the issue where 
-- memorized surahs are being shared across all users

-- Enable Row Level Security (if not already enabled)
ALTER TABLE memorized_surahs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own memorized surahs" ON memorized_surahs;
DROP POLICY IF EXISTS "Users can insert their own memorized surahs" ON memorized_surahs;
DROP POLICY IF EXISTS "Users can delete their own memorized surahs" ON memorized_surahs;

-- Recreate policies with correct user isolation
CREATE POLICY "Users can view their own memorized surahs"
  ON memorized_surahs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memorized surahs"
  ON memorized_surahs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memorized surahs"
  ON memorized_surahs FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Clean up any records with NULL user_id (these would be orphaned)
-- Uncomment the line below if you want to delete records without a user_id
-- DELETE FROM memorized_surahs WHERE user_id IS NULL;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'memorized_surahs';

-- View existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'memorized_surahs';
