-- =====================================================
-- SQL Script to Set Up plant-images Storage Bucket and Policies
-- =====================================================
-- Run this in Supabase SQL Editor
-- This will create the bucket and set up all storage policies
-- =====================================================

-- Step 1: Create storage bucket for plant images
-- Note: If bucket already exists, this will do nothing (ON CONFLICT)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view plant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload plant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update plant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete plant images" ON storage.objects;

-- Step 3: Create storage policies for plant images
-- Policy 1: Public can view plant images (for public access)
CREATE POLICY "Public can view plant images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'plant-images');

-- Policy 2: Authenticated users can upload plant images
CREATE POLICY "Authenticated can upload plant images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-images');

-- Policy 3: Authenticated users can update plant images
CREATE POLICY "Authenticated can update plant images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'plant-images');

-- Policy 4: Authenticated users can delete plant images
CREATE POLICY "Authenticated can delete plant images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'plant-images');

-- =====================================================
-- Verification (Optional - run separately to verify)
-- =====================================================
-- Check if bucket was created:
-- SELECT id, name, public 
-- FROM storage.buckets 
-- WHERE id = 'plant-images';

-- Check if policies were created:
-- SELECT policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects' 
-- AND policyname LIKE '%plant-images%';

