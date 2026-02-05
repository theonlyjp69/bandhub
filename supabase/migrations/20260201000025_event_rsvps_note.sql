-- Migration: event_rsvps_note
-- Add note column to event_rsvps table

ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS note TEXT;

-- Create index for event queries
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status
  ON event_rsvps (event_id, status);
