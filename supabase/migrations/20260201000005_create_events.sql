-- Migration: create_events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('show', 'rehearsal', 'deadline', 'other')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view events"
  ON events FOR SELECT
  USING (
    band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Band members can create events"
  ON events FOR INSERT
  WITH CHECK (
    band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );
