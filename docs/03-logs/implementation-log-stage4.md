# Implementation Log - Stage 4: Events, Availability & Files Backend

**Date:** 2026-02-01
**Status:** Complete

## Overview

Stage 4 implemented all backend server actions for events, RSVPs, availability polling, and file storage. This stage builds on the database schema created in Stage 1 and the authentication/authorization patterns established in Stages 2-3.

## Files Created

| File | Purpose | Functions |
|------|---------|-----------|
| `actions/events.ts` | Event CRUD operations | createEvent, updateEvent, deleteEvent, getBandEvents, getEvent, getUpcomingEvents |
| `actions/rsvps.ts` | RSVP management | setRsvp, getEventRsvps, getUserRsvp, removeRsvp |
| `actions/availability.ts` | When2Meet-style polling | createAvailabilityPoll, getBandPolls, getPoll, submitAvailability, getUserAvailability, deletePoll, getBestTimeSlot |
| `actions/files.ts` | File storage with Supabase Storage | uploadFile, uploadFileWithStorage, getBandFiles, getFileDownloadUrl, deleteFile, updateFileMetadata |

## Implementation Details

### Events (actions/events.ts)

**Functions:**
- `createEvent(input)` - Create event with band membership verification
- `updateEvent(eventId, updates)` - Update event (creator or admin only)
- `deleteEvent(eventId)` - Delete event (creator or admin only)
- `getBandEvents(bandId)` - Get all events for a band with RSVPs
- `getEvent(eventId)` - Get single event with RSVPs and profiles
- `getUpcomingEvents(bandId, limit)` - Get future events only

**Event Types:** show, rehearsal, deadline, other

**Metadata:** JSONB field for venue, pay, load-in times, etc.

### RSVPs (actions/rsvps.ts)

**Functions:**
- `setRsvp(eventId, status)` - Create or update RSVP (upsert)
- `getEventRsvps(eventId)` - Get all RSVPs for an event with profiles
- `getUserRsvp(eventId)` - Get current user's RSVP
- `removeRsvp(eventId)` - Delete user's RSVP

**Status Options:** going, maybe, not_going

### Availability Polling (actions/availability.ts)

**Functions:**
- `createAvailabilityPoll(input)` - Create poll with date options
- `getBandPolls(bandId)` - Get all polls for a band with response counts
- `getPoll(pollId)` - Get poll with all responses and profiles
- `submitAvailability(pollId, slots)` - Submit or update availability response
- `getUserAvailability(pollId)` - Get current user's response
- `deletePoll(pollId)` - Delete poll (creator or admin only)
- `getBestTimeSlot(pollId)` - Calculate optimal time slot

**Date Options Structure:**
```typescript
interface DateOption {
  date: string       // ISO date
  start_time: string // HH:MM
  end_time: string   // HH:MM
}
```

### File Storage (actions/files.ts)

**Functions:**
- `uploadFile(input)` - Create file record (for pre-uploaded files)
- `uploadFileWithStorage(formData)` - Full upload via FormData
- `getBandFiles(bandId)` - Get all files for a band
- `getFileDownloadUrl(fileId)` - Generate 1-hour signed URL
- `deleteFile(fileId)` - Delete from storage and database
- `updateFileMetadata(fileId, updates)` - Update file name/description

**Storage Path:** `{bandId}/{timestamp}_{sanitized_filename}`

## Security Patterns Applied

All functions follow the established security pattern from Stage 3:

1. **Authentication Check**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) throw new Error('Not authenticated')
   ```

2. **Input Validation**
   ```typescript
   if (!eventId) throw new Error('Event ID required')
   ```

3. **Membership Verification**
   ```typescript
   const { data: member } = await supabase
     .from('band_members')
     .select('id')
     .eq('band_id', bandId)
     .eq('user_id', user.id)
     .single()
   if (!member) throw new Error('Access denied')
   ```

4. **Authorization for Updates/Deletes**
   ```typescript
   const isCreator = resource.created_by === user.id
   const { data: adminMember } = await supabase
     .from('band_members')
     .select('id')
     .eq('band_id', resource.band_id)
     .eq('user_id', user.id)
     .eq('role', 'admin')
     .single()
   if (!isCreator && !adminMember) throw new Error('Access denied')
   ```

## Type Handling

JSONB fields required special handling for TypeScript:

```typescript
import type { Json } from '@/types/database'

// Insert
date_options: input.dateOptions as unknown as Json

// Read
const dateOptions = poll.date_options as unknown as DateOption[]
```

Nullable foreign keys required explicit null checks:

```typescript
if (!event || !event.band_id) throw new Error('Event not found')
```

## Verification

- Build: `npm run build` - Passed
- Lint: `npm run lint` - No errors
- All 4 files created and functioning

## Commit

```
1d2d6bf Implement events, availability polling, and file storage backend (Stage 4)
```

---

## Code Review Remediation (2026-02-01)

### Issues Fixed

Code review identified 4 important issues that have been remediated:

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | File deletion RLS policy mismatch | Created migration 20260201000013 to allow admins |
| 2 | Missing membership check in `getUserRsvp()` | Added check at rsvps.ts:94-110 |
| 3 | Missing membership check in `getUserAvailability()` | Added check at availability.ts:175-191 |
| 4 | Missing membership check in `removeRsvp()` | Added check at rsvps.ts:130-146 |

### Root Cause

Inconsistent application of DEC-006 (defense-in-depth pattern). Functions that only accessed "user's own data" skipped membership verification because:
- They only return/modify the user's own records
- RLS provides database-level protection

However, this broke the established pattern where ALL functions verify membership first.

### Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/20260201000013_fix_file_delete_policy.sql` | NEW - RLS policy allowing uploaders OR admins to delete files |
| `actions/rsvps.ts` | Added membership checks to getUserRsvp(), removeRsvp() |
| `actions/availability.ts` | Added membership check to getUserAvailability() |

### Verification

- Build: `npm run build` - Passed
- Lint: `npm run lint` - No errors
- Code review: PASSED (22/22 security patterns correct)

### Updated Status

**Security Patterns:** 22/22 (100%) - up from 18/22 (82%)

See [code-review-stage4.md](code-review/review-logs/code-review-stage4.md) for full review details.

---

## Security Audit Remediation (2026-02-01)

### Issues Fixed

Security audit identified 7 vulnerabilities that have been remediated:

| Priority | Issue | Fix Applied |
|----------|-------|-------------|
| CRITICAL | Path traversal in file upload | Secure filename sanitization + validation (files.ts:223-238) |
| CRITICAL | Storage DELETE policy mismatch | Migration 20260201000015 - admins can delete storage objects |
| HIGH | JSONB array content validation | Type + range validation for availability slots (availability.ts:133-141) |
| HIGH | Array bounds in getBestTimeSlot | Bounds check before array access (availability.ts:282-285) |
| HIGH | No file size limit | 50MB max enforced (files.ts) |
| MEDIUM | MIME type validation | Allowlist of safe file types (files.ts) |
| MEDIUM | Input length limits | Title/description/location caps (events.ts, availability.ts) |

### Files Modified

| File | Changes |
|------|---------|
| `actions/files.ts` | Path traversal fix, file size limit (50MB), MIME type allowlist |
| `actions/availability.ts` | JSONB slot validation, array bounds check, input length limits |
| `actions/events.ts` | Input length limits (title: 200, description: 5000, location: 500) |
| `supabase/migrations/20260201000015_fix_storage_delete_policy.sql` | NEW - Storage DELETE for admins |

### Security Hardening Details

**Path Traversal Prevention (CRITICAL):**
```typescript
// Extract base filename, remove traversal, limit length
const baseName = file.name.split(/[/\\]/).pop() || 'file'
const safeName = baseName
  .replace(/\.\./g, '_')
  .replace(/[^a-zA-Z0-9._-]/g, '_')
  .replace(/^\.+/, '_')
  .substring(0, 100)
// Final validation
if (filePath.includes('..') || !filePath.startsWith(`${bandId}/`)) {
  throw new Error('Invalid filename')
}
```

**JSONB Array Validation (HIGH):**
```typescript
if (!availableSlots.every(slot =>
  typeof slot === 'number' &&
  Number.isInteger(slot) &&
  slot >= 0 &&
  slot < 1000
)) {
  throw new Error('Invalid slot values')
}
```

**File Upload Limits (HIGH + MEDIUM):**
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024  // 50MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  'video/mp4', 'video/webm',
  'application/pdf', 'text/plain', 'text/csv',
  // Office documents...
]
```

### Verification

- Build: `npm run build` - Passed
- Lint: `npm run lint` - No errors
- All 7 vulnerabilities addressed

### Plan Reference

See [2026-02-01-security-remediation-stage4.md](../../plans/2026-02-01-security-remediation-stage4.md) for full plan.

---

## Related Documentation

- [Stage 4 Plan](../../plans/STAGE-4-EVENTS.md)
- [Events Feature Spec](../02-features/events/feature-spec.md)
- [Availability Feature Spec](../02-features/availability/feature-spec.md)
- [Files Feature Spec](../02-features/files/feature-spec.md)
