# Implementation Log - Stage 5: Communication Backend

**Date:** 2026-02-01
**Status:** Complete

## Overview

Stage 5 implemented the communication backend including announcements, threads, messages, and real-time subscriptions. This builds on the communication schema created in Stage 1 and security patterns from Stages 2-4.

## Files Created

| File | Purpose | Functions |
|------|---------|-----------|
| `actions/announcements.ts` | Admin announcements | createAnnouncement, getBandAnnouncements, deleteAnnouncement |
| `actions/threads.ts` | Discussion threads | createThread, getBandThreads, getThread, deleteThread |
| `actions/messages.ts` | Chat messages | sendMessage, getMessages, deleteMessage |
| `hooks/use-realtime-messages.ts` | Real-time message updates | useRealtimeMessages |
| `supabase/migrations/20260201000014_...` | Realtime + DELETE policies | Enable realtime, add DELETE RLS |

## Implementation Details

### Announcements (actions/announcements.ts)

**Functions:**
- `createAnnouncement(bandId, title, content)` - Create announcement (admin only)
- `getBandAnnouncements(bandId)` - Get all announcements for a band
- `deleteAnnouncement(announcementId)` - Delete announcement (creator or admin)

**Security:** Only admins can create announcements (RLS + server-side check)

### Threads (actions/threads.ts)

**Functions:**
- `createThread(bandId, title)` - Create discussion thread (any member)
- `getBandThreads(bandId)` - Get all threads with message counts
- `getThread(threadId)` - Get single thread with profile
- `deleteThread(threadId)` - Delete thread (creator or admin)

**Note:** Thread deletion cascades to all messages (ON DELETE CASCADE)

### Messages (actions/messages.ts)

**Functions:**
- `sendMessage(bandId, content, threadId?)` - Send to main chat or thread
- `getMessages(bandId, threadId?, limit?)` - Get messages with pagination
- `deleteMessage(messageId)` - Delete message (author or admin)

**Message Types:**
- Main chat: `thread_id = null`
- Thread reply: `thread_id = <thread-uuid>`

### Real-time Hook (hooks/use-realtime-messages.ts)

**Features:**
- Initial fetch on mount
- Subscribe to INSERT events for new messages
- Subscribe to DELETE events for removed messages
- Client-side filtering for main chat (excludes thread messages)
- Proper cleanup on unmount

**Usage:**
```typescript
const messages = useRealtimeMessages(bandId)           // Main chat
const messages = useRealtimeMessages(bandId, threadId) // Thread
```

### Migration (20260201000014)

**Changes:**
1. Enable Supabase Realtime on messages table:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ```

2. Add DELETE RLS policies:
   - Announcements: creator OR admin
   - Threads: creator OR admin
   - Messages: author OR admin

## Security Patterns Applied

All functions follow the established security pattern:

1. **Authentication Check**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) throw new Error('Not authenticated')
   ```

2. **Type Guards**
   ```typescript
   if (!bandId || typeof bandId !== 'string') throw new Error('Invalid band ID')
   if (!content || typeof content !== 'string') throw new Error('Invalid content')
   ```

3. **Input Length Limits**
   ```typescript
   if (title.length > 200) throw new Error('Title too long (max 200)')
   if (content.length > 5000) throw new Error('Content too long (max 5000)')
   ```

4. **Membership Verification**
   ```typescript
   const { data: member } = await supabase
     .from('band_members')
     .select('id')
     .eq('band_id', bandId)
     .eq('user_id', user.id)
     .single()
   if (!member) throw new Error('Access denied')
   ```

5. **Authorization for Deletes**
   ```typescript
   const isAuthor = message.user_id === user.id
   const { data: adminMember } = await supabase
     .from('band_members')
     .select('id')
     .eq('band_id', message.band_id)
     .eq('user_id', user.id)
     .eq('role', 'admin')
     .single()
   if (!isAuthor && !adminMember) throw new Error('Access denied')
   ```

## Verification

- Build: `npm run build` - Passed
- Lint: `npm run lint` - No errors
- All 4 files created and functioning

## Commits

```
da254b5 Implement communication backend with real-time messaging (Stage 5)
```

---

## Code Review Remediation (2026-02-01)

### Issues Fixed

Code review identified 4 issues that have been remediated:

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | Critical | Missing input length validation | Added length limits (title: 200, content: 5000) |
| 2 | Critical | Missing type guards | Added `typeof x !== 'string'` checks |
| 3 | Important | useEffect dependency bug | Removed `supabase` from deps array |
| 4 | Important | Missing limit validation | Added limit check (1-500) for getMessages |

### Root Cause

Initial implementation relied solely on RLS for security but lacked the defense-in-depth input validation pattern established in Stage 4 security hardening (events.ts).

### Files Modified

| File | Changes |
|------|---------|
| `actions/announcements.ts` | Type guards + length limits on all 3 functions |
| `actions/threads.ts` | Type guards + title length limit on all 4 functions |
| `actions/messages.ts` | Type guards + content length + limit validation on all 3 functions |
| `hooks/use-realtime-messages.ts` | Fixed useEffect dependency array |

### Input Validation Summary

| Field | Max Length | Applied In |
|-------|------------|------------|
| title | 200 | announcements, threads |
| content | 5000 | announcements, messages |
| limit | 1-500 | messages |

### Verification

- Build: `npm run build` - Passed
- Lint: `npm run lint` - No errors
- Code review: PASSED (11/11 functions properly secured)

### Commit

```
a218e44 security: Add input validation to Stage 5 communication actions
```

---

## Related Documentation

- [Stage 5 Plan](../../plans/STAGE-5-COMMUNICATION.md)
- [Communication Feature Spec](../02-features/communication/feature-spec.md)
