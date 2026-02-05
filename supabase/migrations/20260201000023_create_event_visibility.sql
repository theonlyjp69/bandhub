-- Migration: create_event_visibility
-- Create event_visibility table for private events

CREATE TABLE IF NOT EXISTS event_visibility (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_visibility ENABLE ROW LEVEL SECURITY;

-- Event creators and admins can manage visibility
CREATE POLICY "Creators and admins can manage event visibility" ON event_visibility
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN band_members bm ON bm.band_id = e.band_id
      WHERE e.id = event_visibility.event_id
      AND bm.user_id = auth.uid()
      AND (e.created_by = auth.uid() OR bm.role = 'admin')
    )
  );

-- Users can see if they're in visibility list
CREATE POLICY "Users can see own visibility entries" ON event_visibility
  FOR SELECT USING (auth.uid() = user_id);
