# Security Remediation Plan

> **Historical Document** - Security issues documented here were resolved during Stages 3-5 (2026-02-01). Retained for audit trail.

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/03-logs/security-audit-stage3.md](../docs/03-logs/security-audit-stage3.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

BandHub has **21 security vulnerabilities** identified across Stages 2-5 that must be fixed before proceeding with Stage 4 development. This plan organizes fixes into 3 parallel workstreams with checkpoints after each stage.

---

## Root Causes

| Root Cause | Description |
|------------|-------------|
| Inconsistent Auth Pattern | Some functions check auth, others don't |
| Missing Authorization | Functions authenticate but don't verify permissions |
| No Email Validation | Invitations don't verify user email matches |
| Incomplete RLS | Code relies on RLS policies that are missing |
| No Input Validation | Parameters aren't validated before use |

---

## Issue Summary

| Severity | Count | Examples |
|----------|-------|----------|
| CRITICAL | 5 | `updateMemberRole()`, `acceptInvitation()`, `band_members` RLS |
| HIGH | 8 | `getBand()`, `createInvitation()`, `invitations` RLS |
| MEDIUM | 5 | Open redirect, `getUserInvitations()` email filter |
| LOW | 3 | Error messages, rate limiting, files UPDATE |

---

## Three Parallel Workstreams

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   WORKSTREAM A      │  │   WORKSTREAM B      │  │   WORKSTREAM C      │
│   Server Actions    │  │   RLS Policies      │  │   OAuth/Infra       │
│                     │  │                     │  │                     │
│   Subagent 1        │  │   Subagent 2        │  │   Subagent 3        │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
         │                        │                        │
         ├────────────────────────┼────────────────────────┤
         │                        │                        │
         ▼                        ▼                        ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    CHECKPOINT 2                          │
    │              (Auth stage verified)                       │
    └─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    CHECKPOINT 3                          │
    │              (Bands stage verified)                      │
    └─────────────────────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    CHECKPOINT 4                          │
    │              (Events stage verified)                     │
    └─────────────────────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    CHECKPOINT 5 (FINAL)                  │
    │              (All security fixes complete)               │
    └─────────────────────────────────────────────────────────┘
```

---

## Workstream A: Server Action Fixes

**Owner:** Subagent 1 (Backend Developer)
**Files:** `actions/bands.ts`, `actions/members.ts`, `actions/invitations.ts`

### Standard Pattern for All Actions

```typescript
export async function someAction(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Authenticate
  if (!user) throw new Error('Not authenticated')

  // 2. Validate input
  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid input')
  }

  // 3. Check authorization (get resource, verify membership/admin)
  const { data: member } = await supabase
    .from('band_members')
    .select('role')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')
  if (member.role !== 'admin') throw new Error('Admin required')

  // 4. Perform operation with generic error handling
  try {
    // ... actual operation
  } catch {
    throw new Error('Operation failed')
  }
}
```

### Functions to Fix

| Function | File | Line | Severity | Fix Required |
|----------|------|------|----------|--------------|
| `getBand()` | bands.ts | 46-57 | HIGH | Add auth check |
| `getBandMembers()` | members.ts | 5-18 | HIGH | Add auth check |
| `updateMemberRole()` | members.ts | 20-29 | CRITICAL | Add auth + admin check |
| `removeMember()` | members.ts | 31-40 | CRITICAL | Add auth + admin/self check |
| `createInvitation()` | invitations.ts | 5-24 | HIGH | Add admin check |
| `getUserInvitations()` | invitations.ts | 26-44 | MEDIUM | Add email filter |
| `acceptInvitation()` | invitations.ts | 46-75 | CRITICAL | Add email verification |
| `declineInvitation()` | invitations.ts | 77-86 | CRITICAL | Add auth + email check |

---

## Workstream B: RLS Policy Fixes

**Owner:** Subagent 2 (Database Developer)
**File:** `supabase/migrations/20260201000012_security_remediation.sql`

### Stage 2: Profiles INSERT

```sql
-- Users can only insert their own profile (defense in depth)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Stage 3: Band Management RLS

#### band_members (CRITICAL - missing INSERT/UPDATE/DELETE)

```sql
-- INSERT: Users can add themselves via invitation
CREATE POLICY "Users can join bands via invitation"
  ON band_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- First member (creator)
      NOT EXISTS (SELECT 1 FROM band_members WHERE band_id = band_members.band_id)
      -- Or has valid invitation
      OR EXISTS (
        SELECT 1 FROM invitations
        WHERE band_id = band_members.band_id
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
      )
    )
  );

-- UPDATE: Only admins can update roles
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

-- DELETE: Admins can remove anyone, users can leave
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
```

#### bands (missing UPDATE/DELETE)

```sql
-- UPDATE: Only admins can update band details
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

-- DELETE: Only creator can delete
CREATE POLICY "Creator can delete band"
  ON bands FOR DELETE
  USING (created_by = auth.uid());
```

#### invitations (missing UPDATE/DELETE)

```sql
-- UPDATE: Invitees can accept/decline their own
CREATE POLICY "Invitees can update own invitations"
  ON invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (status IN ('accepted', 'declined'));

-- DELETE: Admins can cancel invitations
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
```

### Stage 4: Events & Availability RLS

```sql
-- events: UPDATE/DELETE for creator or admin
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

-- availability_polls: Same pattern
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
```

### Stage 5: Communication RLS

```sql
-- announcements: UPDATE/DELETE for creator or admin
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

-- threads: Creator can update, creator or admin can delete
CREATE POLICY "Creator can update threads"
  ON threads FOR UPDATE
  USING (created_by = auth.uid());

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

-- messages: Users can edit/delete own
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (user_id = auth.uid());

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

-- files: Uploaders can update metadata
CREATE POLICY "Uploaders can update file metadata"
  ON files FOR UPDATE
  USING (uploaded_by = auth.uid());
```

---

## Workstream C: OAuth/Infrastructure Fixes

**Owner:** Subagent 3 (Security Engineer)
**File:** `app/auth/callback/route.ts`

### Fix Open Redirect Vulnerability

**Current Code (line 7):**
```typescript
const next = searchParams.get('next') ?? '/dashboard'
```

**Fixed Code:**
```typescript
const next = searchParams.get('next') ?? '/dashboard'

// Validate redirect path to prevent open redirect attacks
const isValidPath = (path: string): boolean => {
  return path.startsWith('/') &&
         !path.startsWith('//') &&
         !path.includes('://') &&
         !path.includes('\\')
}

const safePath = isValidPath(next) ? next : '/dashboard'

// Use safePath instead of next in redirect
```

---

## Checkpoints

### Checkpoint 2: Authentication Stage

**Verification:**
```bash
npm run build
npx supabase db push
```

**Tests:**
- [ ] Open redirect blocked: `/auth/callback?next=//evil.com` → redirects to `/dashboard`
- [ ] Profiles INSERT policy applied

---

### Checkpoint 3: Band Management Stage (CRITICAL)

**Verification:**
```bash
npm run build
npm run lint
npx supabase db push
```

**Server Action Tests:**
- [ ] `getBand()` without auth → "Not authenticated"
- [ ] `getBandMembers()` without auth → "Not authenticated"
- [ ] `updateMemberRole()` as non-admin → "Admin required"
- [ ] `removeMember()` as non-admin (not self) → "Admin required"
- [ ] `createInvitation()` as non-admin → "Admin required"
- [ ] `getUserInvitations()` returns only user's email invitations
- [ ] `acceptInvitation()` with wrong email → "not for you"
- [ ] `declineInvitation()` without auth → "Not authenticated"

**RLS Tests (via Supabase SQL):**
- [ ] Non-member cannot INSERT into band_members
- [ ] Non-admin cannot UPDATE band_members roles
- [ ] Non-admin cannot DELETE other band_members
- [ ] Non-admin cannot UPDATE bands
- [ ] Non-creator cannot DELETE bands

---

### Checkpoint 4: Events Stage

**Verification:**
```bash
npm run build
npx supabase db push
```

**RLS Tests:**
- [ ] Non-creator/non-admin cannot UPDATE events
- [ ] Non-creator/non-admin cannot DELETE events
- [ ] Non-creator/non-admin cannot UPDATE availability_polls
- [ ] Non-creator/non-admin cannot DELETE availability_polls

---

### Checkpoint 5: Communication Stage (Final)

**Verification:**
```bash
npm run build
npx supabase db push
```

**RLS Tests:**
- [ ] All communication tables have UPDATE/DELETE policies
- [ ] Only creators/admins can modify content

**Final Integration Test:**
1. User A creates band (becomes admin)
2. User A invites User B
3. User B accepts (email verified)
4. User B tries admin action → Blocked
5. User A modifies band → Works
6. User A removes User B → Works

---

## Critical Files Summary

| Priority | File | Changes |
|----------|------|---------|
| 1 | `actions/invitations.ts` | Fix 4 functions (auth/email verification) |
| 2 | `actions/members.ts` | Fix 3 functions (auth/admin checks) |
| 3 | `actions/bands.ts` | Fix 1 function (auth check) |
| 4 | `app/auth/callback/route.ts` | Add path validation |
| 5 | `supabase/migrations/20260201000012_security_remediation.sql` | All RLS policies |

---

## Skills & Tools to Use

| Skill/Tool | Purpose |
|------------|---------|
| `/root-cause-tracing` | Verify root causes during implementation |
| `/systematic-debugging` | Debug any issues during fixes |
| `/verification-before-completion` | Verify each checkpoint passes |
| `/security` | Final security audit after all fixes |
| `quality-assurance` agent | Review code quality |

---

## Success Criteria

```
✓ All 8 server actions have proper auth/authz checks
✓ All RLS policies complete (SELECT, INSERT, UPDATE, DELETE)
✓ Open redirect vulnerability fixed
✓ All checkpoints verified
✓ Integration test passes
✓ Build succeeds with no TypeScript errors
✓ docs/03-logs/security-audit-stage3.md updated with remediation
✓ CLAUDE.md Known Issues section cleared
```

---

## After Completion

1. Update `docs/03-logs/implementation-log.md` with security fixes
2. Update `docs/00-context/system-state.md` to remove Known Issues
3. Update `CLAUDE.md` Known Issues section
4. Commit: "security: Fix auth/authz vulnerabilities and complete RLS policies"
5. Proceed to Stage 4: Events & Availability Backend

---

*Created: 2026-02-01*
*Status: ~~Ready for Implementation~~ PHASE 1 COMPLETE*

---

# PHASE 2: Complete Remediation (v2)

> **Date:** 2026-02-01
> **Context:** Phase 1 security fixes (21 vulnerabilities) have been implemented. This phase addresses ALL remaining issues from code review logs.

## Status Update

**COMPLETED (Phase 1):**
- 8 server actions secured with auth/authz checks
- 17 RLS policies added via migration `20260201000012_security_remediation.sql`
- Open redirect vulnerability fixed in auth callback

**REMAINING (Phase 2 - This Plan):**
1. **Documentation sync** - Audit logs still show "OPEN" for fixed issues
2. **Code fixes** - Error handling, input validation, stale comments
3. **New documentation** - Storage path conventions
4. **Verification** - Confirm all changes work correctly

---

## Complete Issue Inventory (All Code Review Logs)

### Stage 1 Code Review Issues

| ID | Issue | Location | Status | Fix Required |
|----|-------|----------|--------|--------------|
| SEC-001 | Missing INSERT policy for profiles | migration | ✅ FIXED | Update docs |
| SEC-002 | Missing INSERT policy for band_members | migration | ✅ FIXED | Update docs |
| SEC-003 | Missing UPDATE policy for invitations | migration | ✅ FIXED | Update docs |
| SEC-004 | Missing UPDATE/DELETE for events | migration | ✅ FIXED | Update docs |
| SEC-005 | Missing UPDATE/DELETE for announcements | migration | ✅ FIXED | Update docs |
| SEC-006 | Missing UPDATE/DELETE for threads | migration | ✅ FIXED | Update docs |
| SEC-007 | Missing UPDATE/DELETE for availability_polls | migration | ✅ FIXED | Update docs |
| SEC-008 | Missing UPDATE for files | migration | ✅ FIXED | Update docs |
| SEC-009 | event_rsvps FOR ALL clarity | migration | ✅ FIXED | Update docs |
| REV-001 | Document storage path structure | docs | ❌ OPEN | Create docs |
| REV-002 | Consider database indexes | migration | ⏸️ DEFERRED | Stage 8 |

### Stage 2 Code Review Issues

| ID | Issue | Location | Status | Fix Required |
|----|-------|----------|--------|--------------|
| CR2-001 | Open redirect vulnerability | `auth/callback/route.ts:7` | ✅ FIXED | Update docs |

### Stage 3 Code Review Issues

| ID | Issue | Location | Severity | Status | Fix Required |
|----|-------|----------|----------|--------|--------------|
| CR3-001 | Missing RLS policies (runtime failures) | Database | High | ✅ FIXED | Update docs |
| CR3-002 | `createBand()` no error on band_members insert | `bands.ts:21-23` | High | ❌ OPEN | Add error check |
| CR3-003 | `acceptInvitation()` partial failure handling | `invitations.ts:62-74` | High | ❌ OPEN | Add error check |
| CR3-004 | `getBandMembers()` lacks auth check | `members.ts:5` | Low | ✅ FIXED | Update docs |
| CR3-005 | `getBand()` lacks auth check | `bands.ts:46` | Low | ✅ FIXED | Update docs |
| CR3-006 | Stale comment in `getUserInvitations()` | `invitations.ts:32` | Low | ❌ OPEN | Update comment |

### Additional Improvements (From Analysis)

| ID | Issue | Location | Severity | Fix Required |
|----|-------|----------|----------|--------------|
| NEW-001 | No email format validation | `invitations.ts:11` | Medium | Add regex validation |
| NEW-002 | No duplicate invitation check | `invitations.ts` | Medium | Query before insert |
| NEW-003 | No input length limits | `bands.ts:5` | Medium | Add length validation |
| NEW-004 | No error handling in signOut | `auth.ts:8` | Low | Add try-catch |

---

## Root Cause Analysis

### Primary: Documentation Lag
Code and database remediated, but audit logs not updated to reflect completion.

**Evidence:**
| File | Shows | Actual Status |
|------|-------|---------------|
| `security-audit-stage1.md` | SEC-001 to SEC-009 "Pending" | FIXED |
| `security-audit-stage2.md` | Open redirect "OPEN" | FIXED |
| `security-audit-stage3.md` | All 6 issues "OPEN" | FIXED |
| `code-review-stage3.md` | 4 action items "OPEN" | PARTIALLY FIXED |

### Secondary: Missing Error Handling
- `createBand()` - No check if band_members insert fails (orphaned band risk)
- `acceptInvitation()` - No check if status update fails (double-accept risk)

### Tertiary: Missing Input Validation
- `createInvitation()` - No email format validation
- `createBand()` - No length limits on name/description

---

## Three Parallel Workstreams (Phase 2)

### Workstream A: Documentation Updates (Subagent 1)

| Task | Issue Ref | File | Action |
|------|-----------|------|--------|
| A1 | SEC-001 to SEC-009 | `security-audit-stage1.md` | Mark all 9 items as RESOLVED (2026-02-01) |
| A2 | CR2-001 | `security-audit-stage2.md` | Mark open redirect as RESOLVED |
| A3 | CR3-001,004,005 | `security-audit-stage3.md` | Mark RLS + auth items as RESOLVED |
| A4 | CR3-* | `code-review-stage3.md` | Update all action items with current status |
| A5 | REV-001 | `docs/04-process/storage-conventions.md` | Create new file documenting `{band_id}/{filename}` |
| A6 | REV-002 | `code-review-stage1.md` | Add note: "Deferred to Stage 8" |

### Workstream B: Code Fixes (Subagent 2)

| Task | Issue Ref | File | Line | Change |
|------|-----------|------|------|--------|
| B1 | CR3-002 | `bands.ts` | 21-23 | Add error check on band_members insert |
| B2 | CR3-003 | `invitations.ts` | 62-74 | Add error check on both operations |
| B3 | CR3-006 | `invitations.ts` | 32 | Update stale comment to match implementation |
| B4 | NEW-001 | `invitations.ts` | 11 | Add email format validation regex |
| B5 | NEW-002 | `invitations.ts` | 24 | Add duplicate invitation check query |
| B6 | NEW-003 | `bands.ts` | 5 | Add input length limits (name: 100, desc: 500) |
| B7 | NEW-004 | `auth.ts` | 8 | Wrap signOut in try-catch |

**Code Snippets:**

```typescript
// B1: Error check on band_members insert (bands.ts:21-23)
// After band creation, check if member insert succeeded
const { error: memberError } = await supabase
  .from('band_members')
  .insert({ band_id: band.id, user_id: user.id, role: 'admin' })

if (memberError) {
  // Rollback: delete the orphaned band
  await supabase.from('bands').delete().eq('id', band.id)
  throw new Error('Failed to create band')
}
```

```typescript
// B2: Error check on acceptInvitation (invitations.ts:62-74)
// After band_members insert, check error before updating invitation
const { error: joinError } = await supabase
  .from('band_members')
  .insert({ band_id: invitation.band_id, user_id: user.id, role: 'member' })

if (joinError) throw new Error('Failed to join band')

// Then update invitation status
const { error: updateError } = await supabase
  .from('invitations')
  .update({ status: 'accepted' })
  .eq('id', invitationId)

if (updateError) throw new Error('Failed to update invitation')
```

```typescript
// B3: Update stale comment (invitations.ts:32)
// OLD: "Get user's email from profile or auth"
// NEW: "Filter invitations by user's email address"
```

```typescript
// B4: Email validation helper (add to invitations.ts)
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// In createInvitation(), after existing email check:
if (!isValidEmail(email)) throw new Error('Invalid email format')
```

```typescript
// B5: Duplicate check in createInvitation()
const { data: existing } = await supabase
  .from('invitations')
  .select('id')
  .eq('band_id', bandId)
  .eq('email', email)
  .eq('status', 'pending')
  .single()

if (existing) throw new Error('Invitation already pending for this email')
```

```typescript
// B6: Input validation in createBand()
if (!name || typeof name !== 'string') throw new Error('Name required')
if (name.length > 100) throw new Error('Name too long (max 100 characters)')
if (description && description.length > 500) throw new Error('Description too long')
```

```typescript
// B7: Error handling in signOut()
export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
  }
  redirect('/login')
}
```

### Workstream C: Verification (Subagent 3)

| Stage | Verification Commands |
|-------|----------------------|
| Pre-check | `npx tsc --noEmit && npm run lint` |
| After code | `npm run build` |
| Final | Manual smoke tests |

---

## Stage-by-Stage Execution (Phase 2)

### Stage 1: Baseline Verification
```bash
npx tsc --noEmit   # Confirm code compiles
npm run lint       # Confirm no lint errors
```

### Stage 2: Documentation Updates
**Tasks:** A1-A5 (update all security audit and code review logs)

**Checkpoint 2:**
```bash
# Verify no OPEN items remain in security logs
grep -l "OPEN\|Pending" docs/03-logs/security/implementation-logs/security-audit-logs/*.md
# Expected: Empty (or only intentionally deferred items)
```

### Stage 3: Code Fixes
**Tasks:** B1-B4 (input validation, duplicate checks, error handling)

**Checkpoint 3:**
```bash
npx tsc --noEmit   # Must pass
npm run lint       # Must pass
npm run build      # Must succeed
```

### Stage 4: Final Verification
**Checkpoint 4:**
```bash
npm run build      # Must succeed

# Manual smoke tests:
# 1. createInvitation("invalid") → Error: Invalid email format
# 2. createInvitation(same email twice) → Error: Already pending
# 3. createBand(101 chars) → Error: Name too long
# 4. signOut() → Redirects to /login
```

---

## Skills to Invoke (Phase 2)

| Phase | Skill | Purpose |
|-------|-------|---------|
| Before | `/root-cause-tracing` | Confirm root causes |
| During | `/code-review` | Review each change |
| After | `/verification-before-completion` | Ensure checkpoints pass |
| If fails | `/systematic-debugging` | Debug issues |

---

## Critical Files to Modify (Phase 2)

### Code Files (Workstream B)
| Priority | File | Changes | Issue Refs |
|----------|------|---------|------------|
| 1 | `actions/invitations.ts` | B2 (error handling), B3 (comment), B4 (email validation), B5 (duplicate check) | CR3-003, CR3-006, NEW-001, NEW-002 |
| 2 | `actions/bands.ts` | B1 (error handling), B6 (input validation) | CR3-002, NEW-003 |
| 3 | `actions/auth.ts` | B7 (error handling) | NEW-004 |

### Documentation Files (Workstream A)
| Priority | File | Changes | Issue Refs |
|----------|------|---------|------------|
| 1 | `docs/03-logs/security/.../security-audit-stage1.md` | A1: Mark SEC-001 to SEC-009 RESOLVED | SEC-001-009 |
| 2 | `docs/03-logs/security/.../security-audit-stage2.md` | A2: Mark open redirect RESOLVED | CR2-001 |
| 3 | `docs/03-logs/security/.../security-audit-stage3.md` | A3: Mark RLS/auth items RESOLVED | CR3-001,004,005 |
| 4 | `docs/03-logs/code-review/.../code-review-stage1.md` | A6: Add REV-002 deferral note | REV-002 |
| 5 | `docs/03-logs/code-review/.../code-review-stage3.md` | A4: Update all action items | CR3-* |
| 6 | `docs/04-process/storage-conventions.md` | A5: NEW FILE - storage path docs | REV-001 |

---

## Definition of Done (Phase 2)

### Documentation Complete (Workstream A)
- [ ] A1: SEC-001 to SEC-009 in security-audit-stage1.md marked RESOLVED
- [ ] A2: Open redirect in security-audit-stage2.md marked RESOLVED
- [ ] A3: RLS + auth issues in security-audit-stage3.md marked RESOLVED
- [ ] A4: All action items in code-review-stage3.md updated with current status
- [ ] A5: REV-001 storage convention documented in new file
- [ ] A6: REV-002 marked as "Deferred to Stage 8"

### Code Complete (Workstream B)
- [ ] B1: Error check on band_members insert in createBand()
- [ ] B2: Error check on both operations in acceptInvitation()
- [ ] B3: Stale comment updated in getUserInvitations()
- [ ] B4: Email format validation in createInvitation()
- [ ] B5: Duplicate invitation check in createInvitation()
- [ ] B6: Input length validation in createBand()
- [ ] B7: Error handling in signOut()

### Verification Complete (Workstream C)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke tests:
  - [ ] createInvitation("invalid") → Error: Invalid email format
  - [ ] createInvitation(same email twice) → Error: Already pending
  - [ ] createBand(101 chars) → Error: Name too long
  - [ ] createBand() with DB error → Rollback works
  - [ ] acceptInvitation() with DB error → Proper error handling
  - [ ] signOut() → Redirects to /login even on error

---

## Deferred Items (Not in Scope)

| Item | Target Stage |
|------|--------------|
| REV-002 Database indexes | Stage 8 |
| Rate limiting | Stage 9 |
| Audit logging | Future |
| acceptInvitation atomicity | Stage 8 |

---

*Updated: 2026-02-01*
*Status: Ready for Phase 2 Implementation*
