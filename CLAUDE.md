# BandHub

Band coordination app: Slack + Google Calendar + Trello for musicians.

## Status

**Stage 5 Complete** → Ready for **Stage 6: Integration Tests**

✓ Research | ✓ Foundation | ✓ Auth | ✓ Bands | ✓ Events | ✓ Communication | **Tests** | UI | Deploy

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), Tailwind, shadcn/ui |
| Backend | Supabase (auth, database, realtime, storage) |
| Database | PostgreSQL + RLS (11 migrations) |
| Hosting | Vercel |

**Design:** Dark theme, purple accent (#8b5cf6), mobile-first

## Commands

```bash
npm run dev          # Dev server
npm run build        # Build
npm run lint         # Lint
npm run test         # Run tests (Stage 6)
```

## Structure

```
actions/     # 11 server action files
hooks/       # React hooks (realtime)
app/         # Next.js pages
components/  # shadcn/ui components
lib/         # Supabase clients
supabase/    # 11 migrations
docs/        # 5-tier documentation
plans/       # Stage 0-9 plans
```

## Server Actions (11 files, 33 functions)

| File | Functions |
|------|-----------|
| auth.ts | signOut |
| bands.ts | createBand, getUserBands, getBand |
| members.ts | getBandMembers, updateMemberRole, removeMember |
| invitations.ts | createInvitation, getUserInvitations, acceptInvitation, declineInvitation |
| events.ts | createEvent, getEvents, getEvent, updateEvent, deleteEvent, getUpcomingEvents |
| rsvps.ts | setRsvp, getEventRsvps, getUserRsvp, removeRsvp |
| availability.ts | createPoll, getPolls, getPoll, submitAvailability, getUserAvailability, deletePoll, getBestTimeSlot |
| files.ts | uploadFile, uploadFileWithStorage, getFiles, getFileDownloadUrl, deleteFile, updateFileMetadata |
| announcements.ts | createAnnouncement, getBandAnnouncements, deleteAnnouncement |
| threads.ts | createThread, getBandThreads, getThread, deleteThread |
| messages.ts | sendMessage, getMessages, deleteMessage |

## React Hooks

| File | Hook |
|------|------|
| hooks/use-realtime-messages.ts | useRealtimeMessages(bandId, threadId?) |

## Database (12 tables)

profiles, bands, band_members, invitations, events, event_rsvps, announcements, threads, messages, availability_polls, availability_responses, files

**Realtime:** Messages table enabled for postgres_changes

## Security (Complete)

All 33 server action functions secured with auth + authorization + input validation.

```typescript
// Standard pattern:
export async function action(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!id || typeof id !== 'string') throw new Error('Invalid input')
  // Check membership/admin, then perform operation
}
```

**RLS Policies:** 21 policies (including DELETE for communication tables)

**Input Validation:**
- Type guards on all string parameters
- Length limits: titles (200), content (5000), limit (1-500)

## Key Patterns

1. **Auth** - Check user → validate input → verify membership → execute
2. **RLS** - 21 policies enforce database-level security
3. **Files** - Supabase Storage, signed URLs (1hr), path: `{band_id}/{filename}`
4. **Realtime** - Supabase channels for messages, cleanup on unmount
5. **Errors** - Generic messages prevent info leakage

## Documentation

| Path | Content |
|------|---------|
| docs/00-context/ | Vision, system state |
| docs/01-product/prd.md | Requirements |
| docs/02-features/ | Feature specs |
| docs/03-logs/ | Implementation, security audits, code reviews |
| docs/04-process/ | Workflow, definition of done |

## Plans

| Stage | Focus | Status |
|-------|-------|--------|
| 0-5 | Research → Communication | ✓ Complete |
| 6 | Integration Tests | **Next** |
| 7-9 | UI → Deploy | Pending |

See `plans/MASTER-PLAN.md` for details.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Quick Links

- **Master Plan:** plans/MASTER-PLAN.md
- **PRD:** docs/01-product/prd.md
- **System State:** docs/00-context/system-state.md
- **Stage 6 Plan:** plans/STAGE-6-TESTS.md
