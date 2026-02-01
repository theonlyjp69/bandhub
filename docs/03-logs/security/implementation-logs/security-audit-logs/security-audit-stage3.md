# Security Audit - Stage 3: Band Management Backend

**Date:** 2026-02-01
**Scope:** Server actions for bands, members, and invitations
**Files Reviewed:**
- `actions/bands.ts`
- `actions/members.ts`
- `actions/invitations.ts`
- `supabase/migrations/20260201000003_create_band_members.sql`
- `supabase/migrations/20260201000004_create_invitations.sql`

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| **HIGH** | 3 | ✅ RESOLVED |
| **MEDIUM** | 2 | ✅ RESOLVED |
| **LOW** | 1 | ✅ RESOLVED |

---

## HIGH Severity

### 1. Missing RLS Policies for `band_members` Table
**Location:** `supabase/migrations/20260201000003_create_band_members.sql`

**Risk:** The `band_members` table only has a SELECT policy. There are no INSERT, UPDATE, or DELETE policies. This means:
- `updateMemberRole()` in `actions/members.ts:20` will fail silently or be blocked
- `removeMember()` in `actions/members.ts:31` will fail silently or be blocked
- Adding creator as admin in `createBand()` at `actions/bands.ts:21` will fail

**Remediation:** Add RLS policies:
```sql
-- Admins can add members (for invitation acceptance)
CREATE POLICY "Admins can insert band members"
  ON band_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM band_members WHERE band_id = band_members.band_id AND user_id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid() -- User can add themselves when accepting invite
  );

-- Admins can update roles
CREATE POLICY "Admins can update band members"
  ON band_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM band_members bm WHERE bm.band_id = band_members.band_id AND bm.user_id = auth.uid() AND bm.role = 'admin'));

-- Admins can remove members, users can leave
CREATE POLICY "Admins can delete band members"
  ON band_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM band_members bm WHERE bm.band_id = band_members.band_id AND bm.user_id = auth.uid() AND bm.role = 'admin')
    OR user_id = auth.uid()
  );
```

**Status:** ✅ RESOLVED (2026-02-01) - Added in migration `20260201000012_security_remediation.sql`

---

### 2. Missing RLS UPDATE Policy for `invitations` Table
**Location:** `supabase/migrations/20260201000004_create_invitations.sql`

**Risk:** No UPDATE policy exists. `acceptInvitation()` at `actions/invitations.ts:73` and `declineInvitation()` at `actions/invitations.ts:83` will fail.

**Remediation:** Add UPDATE policy:
```sql
CREATE POLICY "Users can update their own invitations"
  ON invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
```

**Status:** ✅ RESOLVED (2026-02-01) - Added in migration `20260201000012_security_remediation.sql`

---

### 3. `getBand()` Lacks Authorization Check
**Location:** `actions/bands.ts:46-57`

**Risk:** `getBand(bandId)` doesn't verify the user is a member of the band. While RLS should block unauthorized access, the function doesn't check authentication at all - it relies entirely on RLS.

**Remediation:** Add auth check:
```typescript
export async function getBand(bandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  // RLS will handle authorization
  ...
}
```

**Status:** ✅ RESOLVED (2026-02-01) - Auth + membership check added in `actions/bands.ts`

---

## MEDIUM Severity

### 4. `getUserInvitations()` Returns All Pending Invitations
**Location:** `actions/invitations.ts:33-40`

**Risk:** The query filters by `status: 'pending'` but doesn't filter by the current user's email. The RLS policy should filter, but the intent is unclear - relies entirely on RLS working correctly.

**Remediation:** Add explicit email filter or document that RLS handles filtering.

**Status:** ✅ RESOLVED (2026-02-01) - Email filter added in `actions/invitations.ts`

---

### 5. `declineInvitation()` Lacks Auth Check
**Location:** `actions/invitations.ts:77-86`

**Risk:** No authentication check - any client could attempt to decline any invitation. Relies entirely on RLS.

**Remediation:** Add auth check for consistency:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Not authenticated')
```

**Status:** ✅ RESOLVED (2026-02-01) - Auth + email check added in `actions/invitations.ts`

---

## LOW Severity

### 6. Error Messages May Leak Information
**Location:** Multiple files

**Risk:** Throwing raw Supabase errors could expose database structure or internal details.

**Remediation:** Wrap errors with generic messages:
```typescript
if (error) throw new Error('Failed to create band')
```

**Status:** ✅ RESOLVED (2026-02-01) - Generic error messages used in all server actions

---

## Passed Checks

| Check | Status |
|-------|--------|
| SQL Injection | PASS - Using Supabase client parameterized queries |
| XSS | PASS - Server actions, no HTML output |
| CSRF | PASS - Next.js server actions have built-in protection |
| Dependencies (CVEs) | PASS - `npm audit` found 0 vulnerabilities |
| Secrets in Code | PASS - Environment variables used correctly |
| Auth Middleware | PASS - Protected routes properly configured |

---

## Recommended Actions

1. **Immediate:** Create migration to add missing RLS policies for `band_members` and `invitations`
2. **Soon:** Add authentication checks to `getBand()` and `declineInvitation()`
3. **Consider:** Wrap Supabase errors with user-friendly messages

---

## Resolution Log

| Issue | Resolution | Date |
|-------|------------|------|
| Missing RLS policies | Added 17 policies in migration `20260201000012_security_remediation.sql` | 2026-02-01 |
| getBand() lacks auth | Added auth + membership check | 2026-02-01 |
| getUserInvitations() filter | Added explicit email filter | 2026-02-01 |
| declineInvitation() lacks auth | Added auth + email verification | 2026-02-01 |
| Error message leakage | Wrapped with generic error messages | 2026-02-01 |
