-- Migration: create_event_rsvps
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('going', 'maybe', 'not_going')),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view RSVPs"
  ON event_rsvps FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE band_id IN (
        SELECT band_id FROM band_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR ALL
  USING (user_id = auth.uid());
