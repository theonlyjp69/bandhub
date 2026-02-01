# BandHub - Plan Index

## Plan Restructured

The detailed plan has been reorganized into focused, AI-friendly documents.

**Location:** `plans/`

---

## Documents Created

| Document | Purpose |
|----------|---------|
| [MASTER-PLAN.md](./MASTER-PLAN.md) | Vision, features, tech stack, success criteria |
| [STAGE-0-RESEARCH.md](./STAGE-0-RESEARCH.md) | Competitor & market research |
| [STAGE-1-FOUNDATION.md](./STAGE-1-FOUNDATION.md) | Project setup & database schema |
| [STAGE-2-AUTH.md](./STAGE-2-AUTH.md) | Google OAuth authentication |
| [STAGE-3-BANDS.md](./STAGE-3-BANDS.md) | Band management server actions |
| [STAGE-4-EVENTS.md](./STAGE-4-EVENTS.md) | Events & RSVP server actions |
| [STAGE-5-COMMUNICATION.md](./STAGE-5-COMMUNICATION.md) | Chat, threads, announcements, realtime |
| [STAGE-6-TESTS.md](./STAGE-6-TESTS.md) | Integration & E2E tests |
| [STAGE-7-UI.md](./STAGE-7-UI.md) | Functional UI (no styling) |
| [STAGE-8-POLISH.md](./STAGE-8-POLISH.md) | shadcn/ui styling & responsive design |
| [STAGE-9-DEPLOY.md](./STAGE-9-DEPLOY.md) | Production deployment |

---

## How These Documents Work

Each stage document is written as a **prompt for an AI** to follow. They include:

1. **Context** - What stage this is, prerequisites
2. **Goal** - What to accomplish
3. **Tools Available** - MCP servers, agents, skills to use
4. **Tasks** - Step-by-step with code examples
5. **Tests** - What to verify after each task
6. **Checkpoint** - Criteria to pass before next stage

---

## Development Order

```
MASTER-PLAN.md     <- Read first to understand the project
     |
STAGE-0-RESEARCH   <- Research before building
     |
STAGE-1-FOUNDATION <- Set up project & database
     |
STAGE-2-AUTH       <- Implement authentication
     |
STAGE-3-BANDS      <- Band management backend
     |
STAGE-4-EVENTS     <- Events backend
     |
STAGE-5-COMMUNICATION <- Chat, threads, announcements
     |
STAGE-6-TESTS      <- Test everything
     |
STAGE-7-UI         <- Build functional UI
     |
STAGE-8-POLISH     <- Make it look good
     |
STAGE-9-DEPLOY     <- Ship it!
```

---

## Quick Reference: Tools by Stage

| Stage | Primary Tools |
|-------|--------------|
| 0 - Research | WebSearch, WebFetch, gh CLI, market-researcher agent |
| 1 - Foundation | supabase MCP, Bash, code-developer agent |
| 2 - Auth | supabase MCP, context7 MCP, code-developer agent |
| 3-5 - Backend | supabase MCP, code-developer agent, /review skill |
| 6 - Tests | playwright MCP, quality-assurance agent |
| 7 - UI | code-developer agent, context7 MCP |
| 8 - Polish | shadcn-ui MCP, ui-designer agent |
| 9 - Deploy | vercel MCP, /security skill, /ship skill |

---

## Checkpoints (12 Total)

| # | Checkpoint | Stage |
|---|------------|-------|
| 0 | Research Complete | Stage 0 |
| 1.1 | Project Foundation | Stage 1 |
| 1.2 | Core Schema | Stage 1 |
| 1.3 | Complete Schema | Stage 1 |
| 2 | Auth Complete | Stage 2 |
| 3 | Bands Backend | Stage 3 |
| 4 | Events Backend | Stage 4 |
| 5 | Communication Backend | Stage 5 |
| 6 | Tests Passing | Stage 6 |
| 7 | Functional App | Stage 7 |
| 8 | Polished App | Stage 8 |
| 9 | Production Ready | Stage 9 |

---

## Start Here

1. Read [MASTER-PLAN.md](./MASTER-PLAN.md)
2. Begin with [STAGE-0-RESEARCH.md](./STAGE-0-RESEARCH.md)
3. Complete each stage in order
4. Do not skip stages
5. Pass each checkpoint before proceeding
