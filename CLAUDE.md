# BandHub

Band coordination app: Slack + Google Calendar + Trello for musicians.

## Status

**Stage 4 Complete** → Ready for **Stage 5: Communication**

✓ Research | ✓ Foundation | ✓ Auth | ✓ Bands | ✓ Events | **Communication** | Tests | UI | Deploy

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), Tailwind, shadcn/ui |
| Backend | Supabase (auth, database, realtime, storage) |
| Database | PostgreSQL + RLS (13 migrations) |
| Hosting | Vercel |

**Design:** Dark theme, purple accent (#8b5cf6), mobile-first

## Commands

```bash
npm run dev          # Dev server
npm run build        # Build
npm run lint         # Lint
npx supabase db push # Apply migrations
```

## Structure

```
actions/     # 8 server action files
app/         # Next.js pages
components/  # shadcn/ui components
lib/         # Supabase clients
supabase/    # 13 migrations
docs/        # 5-tier documentation
plans/       # Stage 0-9 plans
```

## Server Actions (8 files)

| File | Functions |
|------|-----------|
| auth.ts | signOut |
| bands.ts | createBand, getUserBands, getBand |
| members.ts | getBandMembers, updateMemberRole, removeMember |
| invitations.ts | createInvitation, getUserInvitations, acceptInvitation, declineInvitation |
| events.ts | createEvent, getEvents, getEvent, updateEvent, deleteEvent |
| rsvps.ts | setRsvp, getEventRsvps, getUserRsvp, removeRsvp |
| availability.ts | createPoll, getPolls, getPoll, setResponse, getUserAvailability, deletePoll |
| files.ts | uploadFile, getFiles, getFile, deleteFile |

## Database (12 tables)

profiles, bands, band_members, invitations, events, event_rsvps, announcements, threads, messages, availability_polls, availability_responses, files

## Security (Complete)

All server actions secured with auth + authorization checks.

```typescript
// Standard pattern:
export async function action(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  // Check membership/admin, then perform operation
}
```

**Security Migrations:** `20260201000012_security_remediation.sql`, `20260201000013_fix_file_delete_policy.sql`

## Key Patterns

1. **Auth** - Check user → validate input → verify membership → execute
2. **RLS** - 18 policies enforce database-level security
3. **Files** - Supabase Storage, signed URLs (1hr), path: `{band_id}/{filename}`
4. **Errors** - Generic messages prevent info leakage

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
| 0-4 | Research → Events | ✓ Complete |
| 5 | Communication | **Next** |
| 6-9 | Tests → Deploy | Pending |

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
- **Security:** docs/02-features/security/feature-spec.md
