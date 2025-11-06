-- =====================================================
-- Simple SQL Script to Add Audio Column to Plants Table
-- =====================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Click "Run" to execute
-- =====================================================

-- Step 1: Add audio_url column to plants table
ALTER TABLE public.plants 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Step 2: Add comment to document the column
COMMENT ON COLUMN public.plants.audio_url IS 'URL to MP3 audio file for shloka pronunciation (stored in Supabase storage)';

-- Step 3: Create storage bucket for plant audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-audio', 'plant-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view plant audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload plant audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update plant audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete plant audio" ON storage.objects;

-- Step 5: Create storage policies for plant audio
-- Policy 1: Public can view plant audio (for streaming)
CREATE POLICY "Public can view plant audio"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'plant-audio');

-- Policy 2: Authenticated users can upload plant audio
CREATE POLICY "Authenticated can upload plant audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-audio');

-- Policy 3: Authenticated users can update plant audio
CREATE POLICY "Authenticated can update plant audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'plant-audio');

-- Policy 4: Authenticated users can delete plant audio
CREATE POLICY "Authenticated can delete plant audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'plant-audio');

-- =====================================================
-- Verification (Optional - run separately to verify)
-- =====================================================
-- Check if column was added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
-- AND table_name = 'plants'
-- AND column_name = 'audio_url';

-- Check if bucket was created:
-- SELECT id, name, public 
-- FROM storage.buckets 
-- WHERE id = 'plant-audio';

-- Check if policies were created:
-- SELECT policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects' 
-- AND policyname LIKE '%plant-audio%';

