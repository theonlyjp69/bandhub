-- Migration: Fix remaining RLS policies
-- Fixes: Events UPDATE/DELETE, Invitations auth.users access issue

-- Fix 1: Events UPDATE policy - admins can update events
DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_members.band_id = events.band_id
      AND band_members.user_id = auth.uid()
      AND band_members.role = 'admin'
    )
  );

-- Fix 2: Events DELETE policy - admins can delete events
DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_members.band_id = events.band_id
      AND band_members.user_id = auth.uid()
      AND band_members.role = 'admin'
    )
  );

-- Fix 3: Invitations - recreate with simpler check using is_band_member function
-- First create a helper function to check admin status
CREATE OR REPLACE FUNCTION is_band_admin(p_band_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM band_members
    WHERE band_id = p_band_id
    AND user_id = p_user_id
    AND role = 'admin'
  );
$$;

-- Recreate invitations INSERT policy using the helper
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_band_admin(band_id, auth.uid()));

-- Fix 4: Add invitations UPDATE policy (for accepting/declining)
DROP POLICY IF EXISTS "Invitees can update status" ON invitations;
CREATE POLICY "Invitees can update status"
  ON invitations FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Fix 5: Add invitations DELETE policy (admins can revoke)
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (is_band_admin(band_id, auth.uid()));
