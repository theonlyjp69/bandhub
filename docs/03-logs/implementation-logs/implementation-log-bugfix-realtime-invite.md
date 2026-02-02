# Bugfix: Real-Time Messages & Email Invite UX

**Date:** 2026-02-02
**Plan:** `.claude/plans/vivid-sleeping-wolf.md`

## Issues

1. **Real-time messages not refreshing** - Messages in chat and threads don't appear until page reload
2. **Misleading email invite message** - UI shows "Invitation sent" but no email is actually sent

## Root Causes

### Issue 1: Real-Time Messages
The Supabase client was recreated on every render because `createClient()` was called directly in the hook body (not memoized). This caused:
- New client instance on each render
- Orphaned subscriptions
- Real-time events not reaching the callback

**Location:** `hooks/use-realtime-messages.ts:13`

### Issue 2: Email Invite UX
Email sending was never implemented. The `createInvitation()` action only creates a database record. The success message "Invitation sent to {email}" was misleading since no email is delivered.

**Location:** `app/(app)/band/[id]/members/members-list.tsx:55`

## Changes Made

| File | Change |
|------|--------|
| `hooks/use-realtime-messages.ts` | Added `useMemo` to memoize `createClient()` call |
| `app/(app)/band/[id]/members/members-list.tsx` | Updated success message to be accurate |

### Diff: use-realtime-messages.ts

```diff
-import { useEffect, useState } from 'react'
+import { useEffect, useMemo, useState } from 'react'

 export function useRealtimeMessages(bandId: string, threadId?: string) {
   const [messages, setMessages] = useState<Message[]>([])
-  const supabase = createClient()
+  const supabase = useMemo(() => createClient(), [])
```

### Diff: members-list.tsx

```diff
-      setSuccess(`Invitation sent to ${email}`)
+      setSuccess(`Invitation created for ${email}. They can accept it after signing up.`)
```

## Verification

### Tests
```
npm run test:run
Test Files  4 passed (4)
Tests       55 passed (55)
```

### Build
```
npm run build
✓ Compiled successfully
✓ Generating static pages (9/9)
Exit code: 0
```

### Manual Testing Required
- [ ] Open chat in two browser tabs (same band)
- [ ] Send message in Tab A
- [ ] Verify message appears in Tab B without refresh
- [ ] Repeat for threads page
- [ ] Invite an email and verify new success message

## Status
[x] Code changes complete
[x] Tests pass (55/55)
[x] Build succeeds
[ ] Manual E2E verification (user to confirm)
