# BandHub

Band coordination web app: Slack + Google Calendar + Trello for musicians. Centralizes communication, events, availability polling, and file sharing for bands.

## Current Status

**Stage 3 Complete** → Ready for Stage 4 (Events & Availability Backend)

| Completed | In Progress | Pending |
|-----------|-------------|---------|
| ✓ Research | **Events Backend** | Communication |
| ✓ Foundation | | Tests |
| ✓ Authentication | | UI |
| ✓ Band Management | | Polish & Deploy |

**Existing Code:** `actions/auth.ts`, `actions/bands.ts`, `actions/members.ts`, `actions/invitations.ts`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (auth, database, realtime, storage) |
| Database | PostgreSQL with RLS |
| Calendar | react-big-calendar |
| Hosting | Vercel |

**Design:** Dark theme default, purple accent (#8b5cf6), mobile-first

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests
npx supabase start   # Local Supabase
npx supabase db push # Apply migrations
```

## Project Structure

```
bandhub/
  app/               # Next.js App Router pages
  components/        # React components (shadcn/ui)
  actions/           # Server actions
  lib/               # Utilities, Supabase client
  supabase/migrations/  # Database migrations
  docs/              # Documentation (5-tier)
  plans/             # Development stages (0-9)
```

## Database Schema (12 tables)

| Table | Purpose |
|-------|---------|
| profiles | User profiles (from auth.users) |
| bands | Band entities |
| band_members | User-band relationships with roles |
| invitations | Pending member invites |
| events | Shows, rehearsals, deadlines |
| event_rsvps | Going/maybe/cant responses |
| announcements | Admin posts to band |
| threads | Discussion topics |
| messages | Real-time chat + thread replies |
| availability_polls | When2Meet-style polls |
| availability_responses | Member time slot responses |
| files | Uploaded file metadata |

## Key Patterns

1. **Server Actions** - All mutations via `actions/*.ts`, return `{ success, data?, error? }`
2. **RLS Policies** - Database security, users only access their bands' data
3. **Realtime** - Supabase channels for chat, presence indicators
4. **File Storage** - Supabase Storage with signed URLs (1hr expiry)

## Security Status

**Audit Complete** - 21 vulnerabilities fixed (2026-02-01)

| Category | Fixes Applied |
|----------|---------------|
| Open Redirect | Path validation in OAuth callback |
| Server Actions | Auth + authorization checks on 8 functions |
| RLS Policies | 17 policies added (INSERT/UPDATE/DELETE) |

### Server Action Security Pattern
```typescript
// All server actions follow this pattern:
export async function someAction(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!resourceId) throw new Error('Invalid input')

  // Check authorization (membership/admin as needed)
  // Perform operation
}
```

### Protected Functions
| Function | Authorization |
|----------|---------------|
| `getBand()` | Auth + membership |
| `getBandMembers()` | Auth + membership |
| `updateMemberRole()` | Auth + admin |
| `removeMember()` | Auth + admin OR self |
| `createInvitation()` | Auth + admin |
| `getUserInvitations()` | Auth + email filter |
| `acceptInvitation()` | Auth + email match |
| `declineInvitation()` | Auth + email match |

**Migration:** `supabase/migrations/20260201000012_security_remediation.sql`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Development Stages

| Stage | Focus | Status | Plan |
|-------|-------|--------|------|
| 0 | Research & Discovery | ✓ | plans/STAGE-0-RESEARCH.md |
| 1 | Foundation & Database | ✓ | plans/STAGE-1-FOUNDATION.md |
| 2 | Authentication | ✓ | plans/STAGE-2-AUTH.md |
| 3 | Band Management | ✓ | plans/STAGE-3-BANDS.md |
| 4 | Events & Availability | **Next** | plans/STAGE-4-EVENTS.md |
| 5 | Communication | - | plans/STAGE-5-COMMUNICATION.md |
| 6 | Integration Tests | - | plans/STAGE-6-TESTS.md |
| 7 | Functional UI | - | plans/STAGE-7-UI.md |
| 8 | Polish & Styling | - | plans/STAGE-8-POLISH.md |
| 9 | Deployment | - | plans/STAGE-9-DEPLOY.md |

## Documentation

Navigate via docs/README.md

| Tier | Path | Purpose |
|------|------|---------|
| 00-context | docs/00-context/ | Vision, assumptions, system state |
| 01-product | docs/01-product/prd.md | Product requirements |
| 02-features | docs/02-features/ | Feature specs: auth, bands, events, communication, availability, files |
| 03-logs | docs/03-logs/ | Implementation, decisions, bugs |
| 04-process | docs/04-process/ | Workflow, definition of done |

## Research (Stage 0 Complete)

**Location:** `C:\Users\jpcoo\docs\research\` - competitor-analysis, task-management-patterns, event-management-patterns, ui-ux-guidelines, communication-patterns, github-resources, research-synthesis

## Tools & Resources

**MCP Servers:** supabase (database/auth/storage), shadcn-ui (components), context7 (docs), vercel (deploy), playwright (E2E)

**Agents:** code-developer, system-architect, quality-assurance, ui-designer, market-researcher

**Skills:** /review, /security, /git-commit, /test-generate, /systematic-debugging, /verification-before-completion

## Quick Reference

**Start:** plans/MASTER-PLAN.md | **PRD:** docs/01-product/prd.md | **Status:** docs/00-context/system-state.md
