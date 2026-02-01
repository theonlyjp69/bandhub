-- Fix storage DELETE policy to allow admins (matches server action logic)
-- Issue: Server action allows uploaders OR admins, but storage only allowed uploaders

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Uploaders can delete files" ON storage.objects;

-- Create new policy allowing uploaders OR band admins
CREATE POLICY "Uploaders or admins can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'band-files' AND
    (
      -- Uploaders can delete their own files
      auth.uid() = owner
      OR
      -- Band admins can delete any file in their band
      EXISTS (
        SELECT 1 FROM band_members
        WHERE band_id = (storage.foldername(name))[1]::uuid
        AND user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );
