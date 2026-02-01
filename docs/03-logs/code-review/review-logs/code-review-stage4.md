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
| 1 | File deletion RLS policy mismatch - admins blocked by DB policy | files.ts + migration | **Needs Fix** |
| 2 | Missing membership check in `getUserRsvp()` | rsvps.ts:87-103 | **Needs Fix** |
| 3 | Missing membership check in `getUserAvailability()` | availability.ts:167-183 | **Needs Fix** |
| 4 | Missing membership check in `removeRsvp()` | rsvps.ts:105-119 | **Needs Fix** |

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
| `getUserRsvp()` | ⚠ Missing membership check |
| `removeRsvp()` | ⚠ Missing membership check |
| **Availability** | |
| `createAvailabilityPoll()` | ✓ Complete |
| `getBandPolls()` | ✓ Complete |
| `getPoll()` | ✓ Complete |
| `submitAvailability()` | ✓ Complete |
| `getUserAvailability()` | ⚠ Missing membership check |
| `deletePoll()` | ✓ Complete |
| `getBestTimeSlot()` | ✓ Complete |
| **Files** | |
| `uploadFile()` | ✓ Complete (interface deviation acceptable) |
| `uploadFileWithStorage()` | ✓ Exceeds plan |
| `getBandFiles()` | ✓ Complete |
| `getFileDownloadUrl()` | ✓ Complete |
| `deleteFile()` | ⚠ RLS policy mismatch |
| `updateFileMetadata()` | ✓ Complete |

## Assessment

**Overall Quality:** High - demonstrates excellent security patterns and consistency

**Verdict:** **Needs Fixes** before proceeding to Stage 5

### Required Before Stage 5:
1. Fix file deletion RLS policy for admin access
2. Add membership checks to `getUserRsvp()`, `getUserAvailability()`, `removeRsvp()`

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
| Important issues | 4 |
| Minor issues | 3 |
| Security patterns correct | 18/22 (82%) |

---

*Review conducted using feature-dev:code-reviewer agent*
