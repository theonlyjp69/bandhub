# BandHub

Band coordination app: Slack + Google Calendar + Trello for musicians.

## Status

**Stage 8 Complete** → Ready for **Stage 9: Deploy**

✓ Research | ✓ Foundation | ✓ Auth | ✓ Bands | ✓ Events | ✓ Communication | ✓ Tests | ✓ UI | ✓ Polish | **Deploy**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), Tailwind, shadcn/ui |
| Backend | Supabase (auth, database, realtime, storage) |
| Database | PostgreSQL + RLS (27 migrations) |
| Testing | Vitest + Playwright |
| Hosting | Vercel |

**Design:** Dark theme, purple accent (#8b5cf6), mobile-first

## Commands

```bash
npm run dev          # Dev server
npm run build        # Build
npm run lint         # Lint
npm run test:run     # Run tests once
npm run test:e2e     # E2E tests (requires dev server)
```

## Structure

```
actions/     # 16 server action files (60+ functions)
hooks/       # React hooks (realtime)
app/         # Next.js pages (20 routes)
components/  # shadcn/ui + custom components
  ├── ui/              # shadcn components (Dialog, Button, Input, etc.)
  ├── layout/          # Layout components (MobileNav, etc.)
  ├── create-event-modal.tsx  # Unified event/poll creation modal
  ├── member-selector.tsx     # Private event visibility picker
  └── time-slot-input.tsx     # Poll time options input
lib/         # Supabase clients
supabase/    # 27 migrations
tests/       # 98 Vitest tests
docs/        # Documentation (see docs/README.md)
plans/       # MASTER-PLAN.md + STAGE-9-DEPLOY.md
```

## Server Actions

| File | Functions |
|------|-----------|
| auth.ts | signOut |
| bands.ts | createBand, getUserBands, getBand |
| members.ts | getBandMembers, updateMemberRole, removeMember |
| invitations.ts | createInvitation, getUserInvitations, acceptInvitation, declineInvitation |
| events.ts | createEvent, getBandEvents, getEvent, updateEvent, deleteEvent, getUpcomingEvents, resolvePoll, cancelEvent, closeEvent, getVisibleEvents |
| rsvps.ts | setRsvp, getEventRsvps, getUserRsvp, removeRsvp |
| availability.ts | createPoll, getPolls, getPoll, submitAvailability, getUserAvailability, deletePoll, getBestTimeSlot |
| files.ts | uploadFile, uploadFileWithStorage, getFiles, getFileDownloadUrl, deleteFile, updateFileMetadata |
| announcements.ts | createAnnouncement, getBandAnnouncements, deleteAnnouncement |
| threads.ts | createThread, getBandThreads, getThread, deleteThread |
| messages.ts | sendMessage, getMessages, deleteMessage |
| poll-votes.ts | submitVote, getEventVotes, getUserVotes, getPollResults, getPollSummary |
| event-visibility.ts | setEventVisibility, getEventVisibility, addVisibleUsers, removeVisibleUsers |
| notifications.ts | getUserNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification, createNotification, notifyBandMembers |
| push.ts | subscribeToPush, unsubscribeFromPush, sendPushNotification, getVapidPublicKey |
| notification-preferences.ts | getPreferences, updatePreferences |

## Database (17 tables)

profiles, bands, band_members, invitations, events, event_rsvps, event_visibility, poll_votes, notifications, push_subscriptions, notification_preferences, announcements, threads, messages, availability_polls, availability_responses, files

## Security

All 60+ server actions secured with auth + authorization + input validation.

```typescript
// Standard pattern:
export async function action(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!id || typeof id !== 'string') throw new Error('Invalid input')
  // Check membership/admin, then perform operation
}
```

**RLS Policies:** 27 policies | **Input Validation:** Type guards, length limits (200/5000)

## Key Features

### Unified Event Creation
- **Modal-based workflow** - CreateEventModal replaces separate page
- **Two modes:** Fixed Time (confirmed events) | Find a Time (availability polls)
- **Visibility control:** Band-wide or private (specific members only)
- **Poll resolution:** Creator manually selects winning time slot
- **Notifications:** Toast + in-app + push (with preferences)
- **RSVP tracking:** Optional with deadline and notes

## Key Patterns

1. **Auth** - Check user → validate input → verify membership → execute
2. **RLS** - 27 policies enforce database-level security
3. **Files** - Supabase Storage, signed URLs (1hr), path: `{band_id}/{filename}`
4. **Realtime** - Supabase channels for messages, cleanup on unmount
5. **Errors** - Generic messages prevent info leakage
6. **Events** - Unified model: polls resolve to fixed events when time confirmed

## Tests

| Suite | Tests | Status |
|-------|-------|--------|
| auth.test.ts | 8 | ✅ |
| bands.test.ts | 12 | ✅ |
| events.test.ts | 15 | ✅ |
| events-unified.test.ts | 9 | ✅ |
| poll-votes.test.ts | 11 | ✅ |
| event-visibility.test.ts | 8 | ✅ |
| notifications.test.ts | 15 | ✅ |
| communication.test.ts | 20 | ✅ |
| **Total** | **98** | **All passing** |

## Environment

```
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Phase 2: Notifications (optional)
VAPID_PUBLIC_KEY=              # Web push public key
VAPID_PRIVATE_KEY=             # Web push private key
VAPID_EMAIL=                   # Contact email for push
CRON_SECRET=                   # Protect cron endpoint
SUPABASE_SERVICE_ROLE_KEY=     # For server-side operations
```

## Quick Links

- **Master Plan:** plans/MASTER-PLAN.md
- **PRD:** docs/01-product/prd.md
- **System State:** docs/00-context/system-state.md (full status + design tokens)
- **UI Guidelines:** docs/03-logs/research/ui-ux-guidelines.md
- **Design System:** app/globals.css
- **Archive:** docs/archive/ (historical logs, stage plans, reviews)
- **Create Event Flow:** docs/03-logs/implementation-logs/implementation-log-create-event-flow.md (Phase 3 complete)
