-- Migration: Enable realtime on messages table and add DELETE policies

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add DELETE policy for announcements (creator or admin can delete)
CREATE POLICY "Creators and admins can delete announcements"
  ON announcements FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = announcements.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add DELETE policy for threads (creator or admin can delete)
CREATE POLICY "Creators and admins can delete threads"
  ON threads FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = threads.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add DELETE policy for messages (author or admin can delete)
CREATE POLICY "Authors and admins can delete messages"
  ON messages FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = messages.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
