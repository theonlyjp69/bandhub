-- Fix infinite recursion in band_members RLS policy
-- The original policy referenced band_members inside itself, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can view band members" ON band_members;

-- Create a SECURITY DEFINER function to check band membership
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_band_member(p_band_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM band_members
    WHERE band_id = p_band_id AND user_id = p_user_id
  );
$$;

-- Create a fixed policy using the helper function
CREATE POLICY "Members can view band members"
  ON band_members FOR SELECT
  USING (
    is_band_member(band_id, auth.uid())
  );
