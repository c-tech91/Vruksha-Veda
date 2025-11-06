-- =====================================================
-- Complete SQL Script to Set Up All Storage Buckets and Policies
-- =====================================================
-- This script sets up both plant-images and plant-audio storage
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Add audio_url column to plants table
-- =====================================================

-- Step 1: Add audio_url column to plants table
ALTER TABLE public.plants 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Step 2: Add comment to document the column
COMMENT ON COLUMN public.plants.audio_url IS 'URL to MP3 audio file for shloka pronunciation (stored in Supabase storage)';

-- =====================================================
-- PART 2: Set up plant-images storage bucket and policies
-- =====================================================

-- Step 1: Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view plant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload plant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update plant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete plant images" ON storage.objects;

-- Step 3: Create storage policies for plant images
CREATE POLICY "Public can view plant images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'plant-images');

CREATE POLICY "Authenticated can upload plant images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-images');

CREATE POLICY "Authenticated can update plant images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'plant-images');

CREATE POLICY "Authenticated can delete plant images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'plant-images');

-- =====================================================
-- PART 3: Set up plant-audio storage bucket and policies
-- =====================================================

-- Step 1: Create storage bucket for plant audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-audio', 'plant-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view plant audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload plant audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update plant audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete plant audio" ON storage.objects;

-- Step 3: Create storage policies for plant audio
CREATE POLICY "Public can view plant audio"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'plant-audio');

CREATE POLICY "Authenticated can upload plant audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-audio');

CREATE POLICY "Authenticated can update plant audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'plant-audio');

CREATE POLICY "Authenticated can delete plant audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'plant-audio');

-- =====================================================
-- Verification Queries (Optional - run separately to verify)
-- =====================================================

-- Check if audio_url column was added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
-- AND table_name = 'plants'
-- AND column_name = 'audio_url';

-- Check if buckets were created:
-- SELECT id, name, public 
-- FROM storage.buckets 
-- WHERE id IN ('plant-images', 'plant-audio');

-- Check if all policies were created:
-- SELECT policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects' 
-- AND (policyname LIKE '%plant-images%' OR policyname LIKE '%plant-audio%')
-- ORDER BY policyname;

-- =====================================================
-- Script Complete!
-- =====================================================
-- Summary:
-- 1. Added audio_url column to plants table
-- 2. Created plant-images storage bucket with policies
-- 3. Created plant-audio storage bucket with policies
-- 
-- Policies for both buckets:
-- - Public can view (anon, authenticated)
-- - Authenticated can upload, update, and delete
-- =====================================================

