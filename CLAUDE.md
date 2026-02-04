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
| Database | PostgreSQL + RLS (18 migrations) |
| Testing | Vitest + Playwright |
| Hosting | Vercel |

**Design:** Dark theme, purple accent (#8b5cf6), mobile-first

## Commands

```bash
npm run dev          # Dev server
npm run build        # Build
npm run lint         # Lint
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests once
npm run test:e2e     # E2E tests (requires dev server)
npm run test:e2e:ui  # E2E tests with UI
```

## Structure

```
actions/     # 11 server action files
hooks/       # React hooks (realtime)
app/         # Next.js pages (20 routes + loading/error states)
  ├── page.tsx           # Root redirect (auth → /dashboard, no auth → /login)
  ├── (app)/             # Protected routes (auth required)
  │   ├── layout.tsx     # Header, nav, sign out
  │   ├── error.tsx      # Error boundary
  │   ├── dashboard/     # Band list, invitations (+ loading.tsx)
  │   ├── create-band/   # Create band form
  │   ├── invitations/   # Accept/decline invitations
  │   └── band/[id]/     # Band pages (each with loading.tsx)
  │       ├── page.tsx           # Band home
  │       ├── error.tsx          # Band error boundary
  │       ├── members/           # Member list, invite
  │       ├── calendar/          # Event list
  │       ├── events/new/        # Create event
  │       ├── events/[eventId]/  # Event details, RSVP
  │       ├── announcements/     # Announcements
  │       ├── chat/              # Real-time chat
  │       ├── threads/           # Discussion threads
  │       ├── threads/[threadId]/ # Thread messages
  │       ├── availability/      # Availability polls
  │       ├── availability/new/  # Create poll
  │       ├── availability/[pollId]/ # Poll voting
  │       └── files/             # File upload/download
  ├── not-found.tsx      # 404 page
  ├── global-error.tsx   # Global error boundary
  └── login/             # Google OAuth login
components/  # shadcn/ui components
lib/         # Supabase clients
supabase/    # 16 migrations
tests/       # Test suites (55 tests)
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
| docs/03-logs/research/ | UI/UX guidelines, design patterns, research synthesis |
| docs/04-process/ | Workflow, definition of done |

## Tests

| File | Tests | Status |
|------|-------|--------|
| auth.test.ts | 8 | ✅ All passing |
| bands.test.ts | 12 | ✅ All passing |
| events.test.ts | 15 | ✅ All passing |
| communication.test.ts | 20 | ✅ All passing |
| **Total Vitest** | **55** | **✅ All passing** |
| navigation.spec.ts | 3 | E2E scaffolded |
| full-flow.spec.ts | 8 | E2E scaffolded |

**Run tests:** `npm run test:run`

## Plans

| Stage | Focus | Status |
|-------|-------|--------|
| 0-5 | Research → Communication | ✓ Complete |
| 6 | Integration Tests | ✓ Complete |
| 7 | UI Implementation | ✓ Complete |
| 8 | Polish | ✓ Complete |
| 9 | Deploy | **Next** |

See `plans/MASTER-PLAN.md` for details.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Code Reviews

All stages have been code reviewed. See `docs/03-logs/code-review/review-logs/`:
- Stages 1-5: Security patterns, input validation, RLS policies
- Stage 7: UI implementation - 24 files, 20 routes, PASSED
- **Stage 8:** Polish - shadcn/ui styling, loading/error states, microinteractions

## Stage 8 Polish Summary

| Feature | Files |
|---------|-------|
| shadcn/ui styling | All 20 routes restyled (19 components) |
| Loading states | 14 loading.tsx files with Skeleton components |
| Error states | 4 error boundary files (app, band, not-found, global) |
| Microinteractions | Button press, card hover, focus rings, animations |
| Responsive design | Mobile hamburger menu, bottom nav, responsive grids |

**Code Review:** PASSED (92% plan compliance, 0 critical/important issues)

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Card-based navigation (no sidebar) | Band switching is frequent; card nav makes context explicit; better mobile UX |
| List view instead of calendar grid | More mobile-friendly for musicians checking "what's next" |
| Bottom nav on mobile | Better thumb accessibility than hamburger-only navigation |

**Unused dependency:** `react-big-calendar` - consider removing in future cleanup

## UI Modernization

**Phase 0 Research: Complete** (2026-02-02)

Full visual overhaul researched and documented. See [ui-modernization-research.md](docs/03-logs/research/ui-modernization-research.md) for details.

**Documentation Sources:**
- shadcn/ui theming: ui.shadcn.com/docs/theming (oklch color system)
- Tailwind CSS: tailwindcss.com/docs/animation, colors
- Dribbble: CRM Dashboard, Crypto App, Travel App designs

**Key Changes Planned:**
| Area | Current | Planned |
|------|---------|---------|
| Contrast | 4% (card vs bg) | 10%+ difference |
| Shadows | shadow-sm only | Full elevation scale (xs-xl) |
| Colors | Purple only | Purple + Cyan accents |
| Typography | Standard Tailwind | Display/Headline/Title hierarchy |
| Cards | Flat appearance | Elevated with gradients & glass effects |

**Phases:**
| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Research Documentation | Complete |
| 1 | Color System | Complete |
| 2 | Shadow System | Complete |
| 3 | Typography | Complete |
| 4 | Card Variants | Complete |
| 5 | Navigation & Layout | Complete |
| 6 | Empty States & Loading | Complete |
| 7 | Microinteractions | Complete |
| 8 | Full Page Overhaul | Complete |
| 9 | Final Testing & Docs | Complete |

**Phase 8 Summary (2026-02-02):**
- Part 1: Core pages (dashboard, login, create-band) - 3 files, 18 changes
- Part 2: Band pages (17 pages + 3 components) - 20 files, ~65 changes
- Classes applied: `text-headline`, `text-title`, `card-interactive`, `stagger-item`, `btn-gradient`, `focus-ring-enhanced`, `elevation-2`
- All 55 tests passing
- PR: https://github.com/theonlyjp69/bandhub/pull/1

## Design System (Post-Modernization)

| Token Type | Example Values |
|------------|----------------|
| Colors | `--background`, `--card`, `--card-elevated`, `--surface-1/2/3`, `--accent-secondary` |
| Shadows | `--shadow-xs/sm/md/lg/xl`, `--shadow-primary-glow` |
| Typography | `.text-display`, `.text-headline`, `.text-title`, `.text-gradient-primary` |
| Cards | `.card-interactive`, `.card-glass`, `.card-gradient-border`, `.card-elevated` |
| Animations | `.stagger-item`, `.btn-gradient`, `.animate-scale-in`, `.animate-fade-in` |
| Focus | `.focus-ring-enhanced` |
| Layout | `.empty-state`, `.empty-state-icon`, `.skeleton-modern` |

**Accessibility:** All animations respect `prefers-reduced-motion`.

**Reference:** See `app/globals.css` for full implementation.

## Quick Links

- **Master Plan:** plans/MASTER-PLAN.md
- **PRD:** docs/01-product/prd.md
- **System State:** docs/00-context/system-state.md
- **Stage 8 Log:** docs/03-logs/implementation-logs/implementation-log-stage8.md
- **UI/UX Guidelines:** docs/03-logs/research/ui-ux-guidelines.md
- **Research Synthesis:** docs/03-logs/research/research-synthesis.md
- **UI Modernization Research:** docs/03-logs/research/ui-modernization-research.md
- **UI Modernization Log:** docs/03-logs/implementation-logs/implementation-log-ui-modernization.md
