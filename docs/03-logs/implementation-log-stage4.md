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

## Related Documentation

- [Stage 4 Plan](../../plans/STAGE-4-EVENTS.md)
- [Events Feature Spec](../02-features/events/feature-spec.md)
- [Availability Feature Spec](../02-features/availability/feature-spec.md)
- [Files Feature Spec](../02-features/files/feature-spec.md)
