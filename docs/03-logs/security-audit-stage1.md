# Security Audit Log - Stage 1 RLS Policies

**Date:** 2026-02-01
**Audited By:** Claude Opus 4.5
**Scope:** All 12 database tables + 1 storage bucket
**Status:** Issues logged for remediation in Stage 2/3

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 1 | Pending |
| High | 3 | Pending |
| Medium | 3 | Pending |
| Low | 2 | Pending |

---

## Critical Issues

### SEC-001: Missing INSERT policy for `profiles` table
**File:** `supabase/migrations/20260201000001_create_profiles.sql`
**Lines:** 12-18
**Status:** Pending

**Problem:** Users cannot create their own profile after signup. Without an INSERT policy, new users will get RLS errors when the auth trigger tries to create their profile.

**Fix Required:**
```sql
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**When to Fix:** Stage 2 (Authentication) - Required for signup flow

---

## High Issues

### SEC-002: Missing INSERT policy for `band_members` table
**File:** `supabase/migrations/20260201000003_create_band_members.sql`
**Lines:** 14-20
**Status:** Pending

**Problem:** No policy allows adding members to bands. Band creators can't add themselves as admin, and invitation acceptance won't work.

**Fix Required:**
```sql
-- Allow band creator to add themselves as admin
CREATE POLICY "Creator can add first member"
  ON band_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM bands WHERE id = band_id AND created_by = auth.uid())
  );

-- Allow admins to add members (for accepting invitations)
CREATE POLICY "Admins can add members"
  ON band_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = band_members.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

**When to Fix:** Stage 3 (Band Management)

---

### SEC-003: Missing UPDATE policy for `invitations` table
**File:** `supabase/migrations/20260201000004_create_invitations.sql`
**Lines:** 24-29
**Status:** Pending

**Problem:** Invited users cannot accept/decline invitations (change status from 'pending').

**Fix Required:**
```sql
CREATE POLICY "Invitees can update invitation status"
  ON invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (status IN ('accepted', 'declined'));
```

**When to Fix:** Stage 3 (Band Management)

---

### SEC-004: Missing UPDATE/DELETE policies for `events` table
**File:** `supabase/migrations/20260201000005_create_events.sql`
**Lines:** 18-28
**Status:** Pending

**Problem:** Events cannot be updated or deleted once created.

**Fix Required:**
```sql
CREATE POLICY "Event creator or admin can update events"
  ON events FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = events.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Event creator or admin can delete events"
  ON events FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = events.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

**When to Fix:** Stage 4 (Events & Availability)

---

## Medium Issues

### SEC-005: Missing UPDATE/DELETE policies for `announcements`
**File:** `supabase/migrations/20260201000007_create_communication.sql`
**Lines:** 34-42
**Status:** Pending

**Problem:** Admins cannot edit or delete announcements after creation.

**When to Fix:** Stage 5 (Communication)

---

### SEC-006: Missing UPDATE/DELETE policies for `threads`
**File:** `supabase/migrations/20260201000007_create_communication.sql`
**Lines:** 44-50
**Status:** Pending

**Problem:** Thread creators cannot edit or delete their threads.

**When to Fix:** Stage 5 (Communication)

---

### SEC-007: Missing UPDATE/DELETE policies for `availability_polls`
**File:** `supabase/migrations/20260201000008_create_availability_polling.sql`
**Lines:** 25-31
**Status:** Pending

**Problem:** Poll creators cannot close or delete polls.

**When to Fix:** Stage 4 (Events & Availability)

---

## Low Issues

### SEC-008: Missing UPDATE policy for `files` metadata
**File:** `supabase/migrations/20260201000009_create_files.sql`
**Lines:** 16-26
**Status:** Pending

**Problem:** File uploaders cannot update file name/description.

**When to Fix:** Stage 5 or later

---

### SEC-009: `event_rsvps` FOR ALL policy clarity
**File:** `supabase/migrations/20260201000006_create_event_rsvps.sql`
**Lines:** 22-24
**Status:** Pending

**Problem:** Using `FOR ALL` with only USING clause. Consider splitting into separate INSERT/UPDATE/DELETE policies for clarity.

**When to Fix:** Stage 4 or later (optional refactor)

---

## Passed Checks

- [x] RLS enabled on all 12 tables
- [x] No SQL injection vulnerabilities in policies
- [x] Storage bucket is private (not public)
- [x] Storage policies verify band membership
- [x] Check constraints on enum fields (role, status, event_type)
- [x] Foreign keys with CASCADE delete for cleanup
- [x] Supabase security advisor: No warnings

---

## Remediation Plan

| Stage | Issues to Fix |
|-------|---------------|
| Stage 2 (Auth) | SEC-001 |
| Stage 3 (Bands) | SEC-002, SEC-003 |
| Stage 4 (Events) | SEC-004, SEC-007 |
| Stage 5 (Communication) | SEC-005, SEC-006, SEC-008 |
| Optional | SEC-009 |

---

*This log should be updated as issues are resolved*
