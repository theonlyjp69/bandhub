-- Migration: create_files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,  -- Supabase Storage path
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view files"
  ON files FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can upload files"
  ON files FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Uploaders can delete own files"
  ON files FOR DELETE
  USING (uploaded_by = auth.uid());
