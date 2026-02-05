-- Migration: event_chat
-- Add event_id column to messages table for event-specific chat rooms

ALTER TABLE messages ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_event_id ON messages(event_id);
