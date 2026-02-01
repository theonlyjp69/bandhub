# BandHub

Band coordination web app: Slack + Google Calendar + Trello for musicians. Centralizes communication, events, availability polling, and file sharing for bands.

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

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Development Stages

| Stage | Focus | Plan |
|-------|-------|------|
| 0 | Research & Discovery | plans/STAGE-0-RESEARCH.md |
| 1 | Foundation & Database | plans/STAGE-1-FOUNDATION.md |
| 2 | Authentication | plans/STAGE-2-AUTH.md |
| 3 | Band Management | plans/STAGE-3-BANDS.md |
| 4 | Events & Availability | plans/STAGE-4-EVENTS.md |
| 5 | Communication | plans/STAGE-5-COMMUNICATION.md |
| 6 | Integration Tests | plans/STAGE-6-TESTS.md |
| 7 | Functional UI | plans/STAGE-7-UI.md |
| 8 | Polish & Styling | plans/STAGE-8-POLISH.md |
| 9 | Deployment | plans/STAGE-9-DEPLOY.md |

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

Location: `C:\Users\jpcoo\docs\research\` (external, shared across projects)

| Document | Purpose |
|----------|---------|
| competitor-analysis.md | BandHelper, Bandcamp, Discord comparison |
| task-management-patterns.md | Trello, Linear, Notion patterns |
| event-management-patterns.md | Calendar, RSVP, When2Meet patterns |
| ui-ux-guidelines.md | Design system, colors, typography |
| communication-patterns.md | Slack/Discord thread & notification patterns |
| github-resources.md | Starter templates, npm packages, licenses |
| research-synthesis.md | Recommendations and approved decisions |

## MCP Servers

| Server | Purpose |
|--------|---------|
| supabase | Database, auth, storage, realtime operations |
| shadcn-ui | UI component installation and theming |
| context7 | Library documentation lookup |
| vercel | Deployment and environment management |
| playwright | E2E browser testing |

## Agents

| Agent | When to Use |
|-------|-------------|
| code-developer | Implementation, debugging, refactoring |
| system-architect | Schema design, API patterns, architecture |
| quality-assurance | Testing strategy, code review |
| ui-designer | Component styling, UX improvements |
| market-researcher | Stage 0 competitive research |

## Skills

| Skill | When to Use |
|-------|-------------|
| /review | Before completing any feature |
| /security | After auth and RLS implementation |
| /git-commit | Commit with conventional messages |
| /test-generate | Generate tests for server actions |
| /systematic-debugging | Investigate failing tests or bugs |
| /verification-before-completion | Validate features work end-to-end |

## Quick Reference

**Start:** plans/MASTER-PLAN.md | **PRD:** docs/01-product/prd.md | **Status:** docs/00-context/system-state.md
