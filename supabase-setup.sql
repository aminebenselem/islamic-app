-- Supabase Database Setup for Hayat Muslim App
-- Run this in your Supabase SQL Editor

-- ============================================
-- Create memorized_surahs table
-- ============================================
CREATE TABLE IF NOT EXISTS public.memorized_surahs (
  id SERIAL NOT NULL,
  user_id UUID NULL,
  surah_no INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT memorized_surahs_pkey PRIMARY KEY (id),
  CONSTRAINT memorized_surahs_user_id_surah_no_key UNIQUE (user_id, surah_no),
  CONSTRAINT memorized_surahs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Enable Row Level Security on memorized_surahs
ALTER TABLE memorized_surahs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own memorized surahs" ON memorized_surahs;
DROP POLICY IF EXISTS "Users can insert their own memorized surahs" ON memorized_surahs;
DROP POLICY IF EXISTS "Users can delete their own memorized surahs" ON memorized_surahs;

-- Create policies for memorized_surahs
CREATE POLICY "Users can view their own memorized surahs"
  ON memorized_surahs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memorized surahs"
  ON memorized_surahs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memorized surahs"
  ON memorized_surahs FOR DELETE
  USING (auth.uid() = user_id);
