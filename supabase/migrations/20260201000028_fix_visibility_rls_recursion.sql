-- Migration: fix_visibility_rls_recursion
-- Fix the RLS recursion by using a SECURITY DEFINER function
-- This breaks the cycle: events -> event_visibility -> events

-- Create a helper function that bypasses RLS to check event band membership
CREATE OR REPLACE FUNCTION get_event_band_id(p_event_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT band_id FROM events WHERE id = p_event_id
$$;

-- Drop and recreate event_visibility policies without referencing events table
DROP POLICY IF EXISTS "Band members can manage event visibility" ON event_visibility;
DROP POLICY IF EXISTS "Creators and admins can manage event visibility" ON event_visibility;
DROP POLICY IF EXISTS "Users can see own visibility entries" ON event_visibility;

-- Use the function to avoid recursion
CREATE POLICY "Band members can manage event visibility" ON event_visibility
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = get_event_band_id(event_visibility.event_id)
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can see own visibility entries" ON event_visibility
  FOR SELECT USING (auth.uid() = user_id);

-- Fix poll_votes to use the same function
DROP POLICY IF EXISTS "Band members can view poll votes" ON poll_votes;
DROP POLICY IF EXISTS "Users can view poll votes for visible events" ON poll_votes;
DROP POLICY IF EXISTS "Band members can insert own poll votes" ON poll_votes;
DROP POLICY IF EXISTS "Users can insert own poll votes" ON poll_votes;

CREATE POLICY "Band members can view poll votes" ON poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = get_event_band_id(poll_votes.event_id)
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Band members can insert own poll votes" ON poll_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = get_event_band_id(poll_votes.event_id)
      AND bm.user_id = auth.uid()
    )
  );
