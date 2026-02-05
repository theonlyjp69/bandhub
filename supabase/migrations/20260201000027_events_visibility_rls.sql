-- Migration: events_visibility_rls
-- Update events RLS policy to respect visibility setting

-- Drop existing select policy
DROP POLICY IF EXISTS "Band members can view events" ON events;

-- Create new policy that respects visibility
CREATE POLICY "Users can view visible events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = events.band_id
      AND bm.user_id = auth.uid()
    )
    AND (
      visibility = 'band'
      OR visibility IS NULL
      OR EXISTS (
        SELECT 1 FROM event_visibility ev
        WHERE ev.event_id = events.id AND ev.user_id = auth.uid()
      )
      OR created_by = auth.uid()
    )
  );
