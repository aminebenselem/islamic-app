-- Run this SQL in Supabase SQL Editor to fix the 404 error

-- ============================================
-- Ensure memorized_surahs table exists and has proper policies
-- ============================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.memorized_surahs (
  id SERIAL NOT NULL,
  user_id UUID NULL,
  surah_no INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT memorized_surahs_pkey PRIMARY KEY (id),
  CONSTRAINT memorized_surahs_user_id_surah_no_key UNIQUE (user_id, surah_no),
  CONSTRAINT memorized_surahs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.memorized_surahs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view their own memorized surahs" ON public.memorized_surahs;
DROP POLICY IF EXISTS "Users can insert their own memorized surahs" ON public.memorized_surahs;
DROP POLICY IF EXISTS "Users can delete their own memorized surahs" ON public.memorized_surahs;

CREATE POLICY "Users can view their own memorized surahs"
  ON public.memorized_surahs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memorized surahs"
  ON public.memorized_surahs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memorized surahs"
  ON public.memorized_surahs FOR DELETE
  USING (auth.uid() = user_id);
