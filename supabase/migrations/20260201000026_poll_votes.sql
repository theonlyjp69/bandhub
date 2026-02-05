-- Migration: poll_votes
-- Create poll_votes table for availability poll responses

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('available', 'maybe', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id, slot_key)
);

-- Create index for efficient queries
CREATE INDEX idx_poll_votes_event ON poll_votes (event_id);

-- Enable RLS
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Users can view votes for events they can see (band members who can see the event)
CREATE POLICY "Users can view poll votes for visible events" ON poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN band_members bm ON bm.band_id = e.band_id
      WHERE e.id = poll_votes.event_id
      AND bm.user_id = auth.uid()
      AND (
        e.visibility = 'band'
        OR EXISTS (
          SELECT 1 FROM event_visibility ev
          WHERE ev.event_id = e.id AND ev.user_id = auth.uid()
        )
        OR e.created_by = auth.uid()
      )
    )
  );

-- Users can insert their own votes
CREATE POLICY "Users can insert own poll votes" ON poll_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM events e
      JOIN band_members bm ON bm.band_id = e.band_id
      WHERE e.id = poll_votes.event_id
      AND bm.user_id = auth.uid()
      AND (
        e.visibility = 'band'
        OR EXISTS (
          SELECT 1 FROM event_visibility ev
          WHERE ev.event_id = e.id AND ev.user_id = auth.uid()
        )
        OR e.created_by = auth.uid()
      )
    )
  );

-- Users can update their own votes
CREATE POLICY "Users can update own poll votes" ON poll_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own poll votes" ON poll_votes
  FOR DELETE USING (auth.uid() = user_id);
