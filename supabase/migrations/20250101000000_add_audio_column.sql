-- Add audio column to plants table for shloka audio/voice
ALTER TABLE public.plants 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.plants.audio_url IS 'URL to MP3 audio file for shloka pronunciation (stored in Supabase storage)';

-- Create storage bucket for plant audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-audio', 'plant-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for plant audio
CREATE POLICY IF NOT EXISTS "Public can view plant audio"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'plant-audio');

CREATE POLICY IF NOT EXISTS "Authenticated can upload plant audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-audio');

CREATE POLICY IF NOT EXISTS "Authenticated can update plant audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'plant-audio');

CREATE POLICY IF NOT EXISTS "Authenticated can delete plant audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'plant-audio');

