-- Fix file deletion RLS policy to allow admins (Issue #1 from code-review-stage4.md)
-- Previously only uploaders could delete, but server action allows uploaders OR admins

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Uploaders can delete own files" ON files;

-- Create new policy allowing uploaders OR band admins
CREATE POLICY "Uploaders or admins can delete files"
  ON files FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = files.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
