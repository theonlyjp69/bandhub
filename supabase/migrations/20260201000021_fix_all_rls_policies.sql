-- Migration: Fix RLS policies for band creation flow
-- Problem: createBand does .insert().select() but SELECT policy requires band_members
-- which doesn't exist yet at the time of insert

-- Fix 1: Bands INSERT policy - creators must own their band
DROP POLICY IF EXISTS "Anyone can create bands" ON bands;
DROP POLICY IF EXISTS "Authenticated users can create bands" ON bands;
CREATE POLICY "Authenticated users can create bands"
  ON bands FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Fix 2: Bands SELECT policy - include bands you created (for immediate return after insert)
DROP POLICY IF EXISTS "Members can view their bands" ON bands;
CREATE POLICY "Members or creators can view bands"
  ON bands FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );

-- Fix 3: Add INSERT policy for band_members
-- Allow inserting yourself as admin if you created the band
-- Allow admins to add other members
DROP POLICY IF EXISTS "Creator can add themselves" ON band_members;
DROP POLICY IF EXISTS "Admins can add members" ON band_members;
CREATE POLICY "Users can join bands they created or admins can add members"
  ON band_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Creator adding themselves to their own band
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM bands WHERE id = band_id AND created_by = auth.uid()
    ))
    OR
    -- Admin adding other members
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = band_members.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Fix 4: Add UPDATE policy for band_members (admin only)
DROP POLICY IF EXISTS "Admins can update member roles" ON band_members;
CREATE POLICY "Admins can update member roles"
  ON band_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = band_members.band_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
  );

-- Fix 5: Add DELETE policy for band_members (admin or self-remove)
DROP POLICY IF EXISTS "Members can leave or admins can remove" ON band_members;
CREATE POLICY "Members can leave or admins can remove"
  ON band_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = band_members.band_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
  );
