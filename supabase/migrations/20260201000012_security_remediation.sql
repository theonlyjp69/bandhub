-- Security Remediation Migration
-- Fixes 21 security vulnerabilities across Stages 2-5
-- Created: 2026-02-01

-- ============================================
-- STAGE 2: Authentication Fixes
-- ============================================

-- Profiles: Users can only insert their own profile (defense in depth)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- STAGE 3: Band Management Fixes (CRITICAL)
-- ============================================

-- band_members INSERT: Users can add themselves via invitation or as first member
CREATE POLICY "Users can join bands via invitation"
  ON band_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- First member (creator) - no other members exist yet
      NOT EXISTS (SELECT 1 FROM band_members bm WHERE bm.band_id = band_members.band_id)
      -- Or has valid pending invitation
      OR EXISTS (
        SELECT 1 FROM invitations i
        WHERE i.band_id = band_members.band_id
        AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND i.status = 'pending'
      )
    )
  );

-- band_members UPDATE: Only admins can update roles
CREATE POLICY "Admins can update band members"
  ON band_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = band_members.band_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
  );

-- band_members DELETE: Admins can remove anyone, users can leave themselves
CREATE POLICY "Admins can remove members or users can leave"
  ON band_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = band_members.band_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
  );

-- bands UPDATE: Only admins can update band details
CREATE POLICY "Admins can update bands"
  ON bands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = bands.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- bands DELETE: Only creator can delete band
CREATE POLICY "Creator can delete band"
  ON bands FOR DELETE
  USING (created_by = auth.uid());

-- invitations UPDATE: Invitees can accept/decline their own invitations
CREATE POLICY "Invitees can update own invitations"
  ON invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (status IN ('accepted', 'declined'));

-- invitations DELETE: Admins can cancel invitations
CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = invitations.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- STAGE 4: Events & Availability Fixes
-- ============================================

-- events UPDATE: Creator or admin can update
CREATE POLICY "Creator or admin can update events"
  ON events FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = events.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- events DELETE: Creator or admin can delete
CREATE POLICY "Creator or admin can delete events"
  ON events FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = events.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- availability_polls UPDATE: Creator or admin can update
CREATE POLICY "Creator or admin can update polls"
  ON availability_polls FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = availability_polls.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- availability_polls DELETE: Creator or admin can delete
CREATE POLICY "Creator or admin can delete polls"
  ON availability_polls FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = availability_polls.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- STAGE 5: Communication Fixes
-- ============================================

-- announcements UPDATE: Creator or admin can update
CREATE POLICY "Creator or admin can update announcements"
  ON announcements FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = announcements.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- announcements DELETE: Creator or admin can delete
CREATE POLICY "Creator or admin can delete announcements"
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

-- threads UPDATE: Creator can update their own threads
CREATE POLICY "Creator can update threads"
  ON threads FOR UPDATE
  USING (created_by = auth.uid());

-- threads DELETE: Creator or admin can delete
CREATE POLICY "Creator or admin can delete threads"
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

-- messages UPDATE: Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (user_id = auth.uid());

-- messages DELETE: Users can delete own, admins can delete any
CREATE POLICY "Users can delete own messages or admins can delete"
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

-- files UPDATE: Uploaders can update file metadata
CREATE POLICY "Uploaders can update file metadata"
  ON files FOR UPDATE
  USING (uploaded_by = auth.uid());
