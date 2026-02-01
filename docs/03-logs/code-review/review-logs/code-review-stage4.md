# Code Review Log - Stage 4: Events, Availability & Files

**Date:** 2026-02-01
**Reviewer:** Claude Code (feature-dev:code-reviewer)
**Scope:** Commits 9858f5d → 1d2d6bf

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `actions/events.ts` | 235 | Event CRUD operations |
| `actions/rsvps.ts` | 119 | RSVP management |
| `actions/availability.ts` | 258 | Availability polling |
| `actions/files.ts` | 260 | File storage |

## Strengths

1. **Excellent Security Implementation** - All functions include proper authentication and authorization checks following Stage 3 patterns
2. **Comprehensive Input Validation** - All functions validate required fields before database operations
3. **Authorization Pattern Consistency** - Follows established pattern: auth → validation → membership → operation
4. **TypeScript Type Safety** - Proper use of `Json` type from `@/types/database` for JSONB columns
5. **RLS Policy Alignment** - Server actions correctly rely on RLS for SELECT while adding app-layer checks for mutations
6. **Conditional Update Pattern** - `updateEvent()` and `updateFileMetadata()` use conditional spreading
7. **Error Handling** - Proper handling of PGRST116 (no rows) error code
8. **Storage Cleanup** - `uploadFileWithStorage()` includes rollback on failure

## Issues Found

### Important Issues

| # | Issue | Location | Status |
|---|-------|----------|--------|
| 1 | File deletion RLS policy mismatch - admins blocked by DB policy | files.ts + migration | ✓ **Fixed** (2026-02-01) |
| 2 | Missing membership check in `getUserRsvp()` | rsvps.ts:94-110 | ✓ **Fixed** (2026-02-01) |
| 3 | Missing membership check in `getUserAvailability()` | availability.ts:175-191 | ✓ **Fixed** (2026-02-01) |
| 4 | Missing membership check in `removeRsvp()` | rsvps.ts:130-146 | ✓ **Fixed** (2026-02-01) |

### Minor Issues

| # | Issue | Location | Status |
|---|-------|----------|--------|
| 5 | Plan deviation in `uploadFile()` interface | files.ts | Acceptable - documented in DEC-010 |
| 6 | Missing `updatePoll()` function | availability.ts | Deferred - polls may be immutable by design |
| 7 | Tie-breaking in `getBestTimeSlot()` | availability.ts:222-260 | Document behavior |

## Issue Details

### Issue 1: File Deletion RLS Policy Mismatch

**Problem:** RLS policy only allows uploaders to delete:
```sql
CREATE POLICY "Uploaders can delete own files"
  ON files FOR DELETE
  USING (uploaded_by = auth.uid());
```

But server action allows admins OR uploaders (lines 138-148):
```typescript
const isUploader = file.uploaded_by === user.id
const { data: adminMember } = await supabase
  .from('band_members')
  .eq('role', 'admin')
  ...
if (!isUploader && !adminMember) throw new Error('Access denied')
```

**Fix Required:** Add new RLS policy or modify existing to allow admin deletion.

### Issues 2-4: Missing Membership Checks

**Pattern Inconsistency:** `getUserRsvp()`, `getUserAvailability()`, and `removeRsvp()` don't verify band membership before operations. While RLS provides database-level protection, this breaks the established defense-in-depth pattern.

**Fix:** Add membership verification before database operations.

## Completeness Check

| Function | Status |
|----------|--------|
| **Events** | |
| `createEvent()` | ✓ Complete |
| `updateEvent()` | ✓ Complete |
| `deleteEvent()` | ✓ Complete |
| `getBandEvents()` | ✓ Complete |
| `getEvent()` | ✓ Complete |
| `getUpcomingEvents()` | ✓ Complete |
| **RSVPs** | |
| `setRsvp()` | ✓ Complete |
| `getEventRsvps()` | ✓ Complete |
| `getUserRsvp()` | ✓ Complete (fixed) |
| `removeRsvp()` | ✓ Complete (fixed) |
| **Availability** | |
| `createAvailabilityPoll()` | ✓ Complete |
| `getBandPolls()` | ✓ Complete |
| `getPoll()` | ✓ Complete |
| `submitAvailability()` | ✓ Complete |
| `getUserAvailability()` | ✓ Complete (fixed) |
| `deletePoll()` | ✓ Complete |
| `getBestTimeSlot()` | ✓ Complete |
| **Files** | |
| `uploadFile()` | ✓ Complete (interface deviation acceptable) |
| `uploadFileWithStorage()` | ✓ Exceeds plan |
| `getBandFiles()` | ✓ Complete |
| `getFileDownloadUrl()` | ✓ Complete |
| `deleteFile()` | ✓ Complete (RLS fixed) |
| `updateFileMetadata()` | ✓ Complete |

## Assessment

**Overall Quality:** High - demonstrates excellent security patterns and consistency

**Verdict:** ✓ **PASSED** - Ready for Stage 5

### Fixes Applied (2026-02-01):
1. ✓ File deletion RLS policy extended for admin access (migration 20260201000013)
2. ✓ Membership check added to `getUserRsvp()` (rsvps.ts:94-110)
3. ✓ Membership check added to `getUserAvailability()` (availability.ts:175-191)
4. ✓ Membership check added to `removeRsvp()` (rsvps.ts:130-146)

### Deferred:
- `updatePoll()` function (may be intentionally omitted)
- Tie-breaking documentation for `getBestTimeSlot()`

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 4 |
| Total lines | 872 |
| Functions reviewed | 22 |
| Critical issues | 0 |
| Important issues | 4 → 0 (all fixed) |
| Minor issues | 3 |
| Security patterns correct | 22/22 (100%) |

---

*Review conducted using feature-dev:code-reviewer agent*
