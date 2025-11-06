-- =====================================================
-- Complete SQL Script to Add Audio Column to Plants Table
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This will add the audio_url column and set up storage
-- =====================================================

-- Step 1: Add audio_url column to plants table
ALTER TABLE public.plants 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Step 2: Add comment to document the column
COMMENT ON COLUMN public.plants.audio_url IS 'URL to MP3 audio file for shloka pronunciation (stored in Supabase storage)';

-- Step 3: Create storage bucket for plant audio files
-- Note: If bucket already exists, this will do nothing (ON CONFLICT)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-audio', 'plant-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create storage policies for plant audio
-- Policy 1: Public can view plant audio (for streaming)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view plant audio'
  ) THEN
    CREATE POLICY "Public can view plant audio"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'plant-audio');
  END IF;
END $$;

-- Policy 2: Authenticated users can upload plant audio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated can upload plant audio'
  ) THEN
    CREATE POLICY "Authenticated can upload plant audio"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'plant-audio');
  END IF;
END $$;

-- Policy 3: Authenticated users can update plant audio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated can update plant audio'
  ) THEN
    CREATE POLICY "Authenticated can update plant audio"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'plant-audio');
  END IF;
END $$;

-- Policy 4: Authenticated users can delete plant audio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated can delete plant audio'
  ) THEN
    CREATE POLICY "Authenticated can delete plant audio"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'plant-audio');
  END IF;
END $$;

-- =====================================================
-- Verification Query (Optional - run to verify)
-- =====================================================
-- Uncomment the lines below to verify the changes:

-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
-- AND table_name = 'plants'
-- AND column_name = 'audio_url';

-- SELECT id, name, public 
-- FROM storage.buckets 
-- WHERE id = 'plant-audio';

-- SELECT policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects' 
-- AND policyname LIKE '%plant-audio%';

-- =====================================================
-- Script Complete!
-- =====================================================
-- The audio_url column has been added to your plants table
-- The plant-audio storage bucket has been created
-- Storage policies have been set up for public read and authenticated write
-- =====================================================

