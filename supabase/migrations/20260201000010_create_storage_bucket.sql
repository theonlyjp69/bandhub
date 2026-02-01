-- Migration: create_storage_bucket
-- Create storage bucket for band files
INSERT INTO storage.buckets (id, name, public)
VALUES ('band-files', 'band-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for band-files bucket
CREATE POLICY "Band members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'band-files' AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Band members can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'band-files' AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Uploaders can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'band-files' AND
    auth.uid() = owner
  );
