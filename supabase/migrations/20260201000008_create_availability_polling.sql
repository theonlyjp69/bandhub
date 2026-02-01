-- Migration: create_availability_polling
CREATE TABLE availability_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_options JSONB NOT NULL,  -- Array of {date, start_time, end_time}
  closes_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES availability_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  available_slots JSONB NOT NULL,  -- Array of selected slot indices
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE availability_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view polls"
  ON availability_polls FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can create polls"
  ON availability_polls FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can view responses"
  ON availability_responses FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM availability_polls WHERE band_id IN (
        SELECT band_id FROM band_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own responses"
  ON availability_responses FOR ALL
  USING (user_id = auth.uid());
