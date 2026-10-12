-- Create storage bucket for mentor verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mentor-documents',
  'mentor-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS policies for mentor documents bucket
CREATE POLICY "Mentors can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mentor-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Mentors can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'mentor-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all mentor documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'mentor-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add verification token column to mentors table for email verification links
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS verification_expires_at timestamp with time zone;