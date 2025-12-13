-- Create storage bucket for lesson materials (PDFs, videos, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-materials',
  'lesson-materials',
  true,
  104857600, -- 100MB in bytes
  ARRAY[
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Note: storage.objects already has RLS enabled by default in Supabase

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can upload lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view lesson materials" ON storage.objects;

-- Policy: Allow admins to upload lesson materials
CREATE POLICY "Admins can upload lesson materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-materials' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Allow admins to update lesson materials
CREATE POLICY "Admins can update lesson materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-materials' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Allow admins to delete lesson materials
CREATE POLICY "Admins can delete lesson materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-materials' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Allow everyone to view lesson materials (public bucket)
CREATE POLICY "Anyone can view lesson materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-materials');
