-- Migration: unified_events
-- Add new columns to events table for unified event model (fixed + poll modes)

-- Add new columns for unified event model
ALTER TABLE events ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'fixed';
ALTER TABLE events ADD COLUMN IF NOT EXISTS poll_options JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS poll_closes_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS resolved_slot_key TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS require_rsvp BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'band';
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Add check constraints
ALTER TABLE events ADD CONSTRAINT events_mode_check
  CHECK (mode IN ('fixed', 'poll'));
ALTER TABLE events ADD CONSTRAINT events_visibility_check
  CHECK (visibility IN ('band', 'private'));
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('open', 'closed', 'cancelled'));

-- Update event_type CHECK constraint to include new types
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN ('show', 'rehearsal', 'meeting', 'recording', 'photoshoot', 'deadline', 'other'));

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_band_mode
  ON events (band_id, mode, poll_closes_at);
