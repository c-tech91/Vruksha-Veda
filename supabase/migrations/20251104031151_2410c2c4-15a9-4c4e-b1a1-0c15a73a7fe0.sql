-- Create plants table
CREATE TABLE IF NOT EXISTS public.plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  botanical_name TEXT,
  family TEXT,
  synonyms TEXT[] DEFAULT '{}',
  english_name TEXT,
  useful_parts TEXT[] DEFAULT '{}',
  indications TEXT[] DEFAULT '{}',
  shloka TEXT,
  source_document TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for plant detail pages without auth)
CREATE POLICY "Public can view plants"
ON public.plants
FOR SELECT
TO anon, authenticated
USING (true);

-- Create policy for admin insert
CREATE POLICY "Admin can insert plants"
ON public.plants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for admin update
CREATE POLICY "Admin can update plants"
ON public.plants
FOR UPDATE
TO authenticated
USING (true);

-- Create policy for admin delete
CREATE POLICY "Admin can delete plants"
ON public.plants
FOR DELETE
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_plants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_plants_updated_at
BEFORE UPDATE ON public.plants
FOR EACH ROW
EXECUTE FUNCTION public.update_plants_updated_at();

-- Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for plant images
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