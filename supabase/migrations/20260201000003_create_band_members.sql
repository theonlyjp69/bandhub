-- Migration: create_band_members
CREATE TABLE band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(band_id, user_id)
);

ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;

-- Users can only see bands they're members of
CREATE POLICY "Members can view band members"
  ON band_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM band_members bm WHERE bm.band_id = band_members.band_id
    )
  );

-- Add RLS to bands table (depends on band_members)
CREATE POLICY "Members can view their bands"
  ON bands FOR SELECT
  USING (
    id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create bands"
  ON bands FOR INSERT
  WITH CHECK (auth.uid() = created_by);
