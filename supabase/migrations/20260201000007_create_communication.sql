-- Migration: create_communication
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add policies (band members only)
CREATE POLICY "Band members can view announcements"
  ON announcements FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM band_members WHERE band_id = announcements.band_id AND user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Band members can view threads"
  ON threads FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can create threads"
  ON threads FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can view messages"
  ON messages FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can send messages"
  ON messages FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));
