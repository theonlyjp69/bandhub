# BandHub Documentation

Welcome to the BandHub documentation. This structure follows a 5-tier hierarchy for optimal navigation and context.

---

## Quick Links

| I want to... | Go to... |
|--------------|----------|
| Understand the project | [00-context/vision.md](00-context/vision.md) |
| See product requirements | [01-product/prd.md](01-product/prd.md) |
| Read feature specs | [02-features/](02-features/) |
| Check implementation progress | [03-logs/security/implementation-logs/](03-logs/security/implementation-logs/) |
| Learn the workflow | [04-process/dev-workflow.md](04-process/dev-workflow.md) |
| See development plans | [../plans/MASTER-PLAN.md](../plans/MASTER-PLAN.md) |

---

## Current Status

**Stage 4 Complete** → Ready for **Stage 5: Communication Backend**

✓ Research | ✓ Foundation | ✓ Auth | ✓ Bands | ✓ Events | **Communication** | Tests | UI | Polish | Deploy

---

## Documentation Structure

```
docs/
├── 00-context/              # WHY and WHAT EXISTS
│   ├── vision.md           # Project vision and goals
│   ├── assumptions.md      # Technical and business assumptions
│   └── system-state.md     # Current project status
│
├── 01-product/              # WHAT the product must do
│   └── prd.md              # Product Requirements Document
│
├── 02-features/             # HOW features work
│   ├── auth/               # Authentication
│   ├── bands/              # Band management
│   ├── events/             # Events & calendar
│   ├── availability/       # Availability polling
│   ├── files/              # File storage
│   └── communication/      # Chat, threads, announcements
│
├── 03-logs/                 # MEMORY (what changed)
│   ├── security/              # Security audit and implementation logs
│   ├── code-review/           # Code review logs by stage
│   ├── decisions-log.md       # ADRs
│   ├── bug-log.md             # Bug tracking
│   ├── validation-log.md      # Test results
│   └── insights.md            # Learnings
│
├── 04-process/              # HOW to work
│   ├── dev-workflow.md        # Development process
│   ├── definition-of-done.md  # Completion criteria
│   └── llm-prompts.md         # Claude patterns
│
└── README.md               # This file
```

---

## Tier Descriptions

### 00-context: Project Context
**Purpose:** Understand why this project exists and its current state.

| File | Description |
|------|-------------|
| [vision.md](00-context/vision.md) | Product vision, target users, competitive position |
| [assumptions.md](00-context/assumptions.md) | Technical constraints, business assumptions |
| [system-state.md](00-context/system-state.md) | Current implementation status (update regularly) |

### 01-product: Product Definition
**Purpose:** Define what the product must do.

| File | Description |
|------|-------------|
| [prd.md](01-product/prd.md) | Complete Product Requirements Document |

### 02-features: Feature Documentation
**Purpose:** Detailed specs for each feature.

| Feature | Path | Key Files |
|---------|------|-----------|
| Authentication | [auth/](02-features/auth/) | feature-spec.md, tech-design.md |
| Band Management | [bands/](02-features/bands/) | feature-spec.md |
| Events & Calendar | [events/](02-features/events/) | feature-spec.md, tech-design.md |
| Availability | [availability/](02-features/availability/) | feature-spec.md, tech-design.md |
| File Storage | [files/](02-features/files/) | feature-spec.md, tech-design.md |
| Communication | [communication/](02-features/communication/) | feature-spec.md |
| **Security** | [security/](02-features/security/) | feature-spec.md |

### 03-logs: Project Memory
**Purpose:** Track what happened and why.

| Path | Description |
|------|-------------|
| [implementation-log-stage4.md](03-logs/implementation-log-stage4.md) | Stage 4 implementation details |
| [security/](03-logs/security/) | Security audits and implementation logs |
| [code-review/](03-logs/code-review/) | Code review logs by stage |
| [decisions-log.md](03-logs/decisions-log.md) | Architecture Decision Records (DEC-001 to DEC-010) |
| [bug-log.md](03-logs/bug-log.md) | Bug tracking and resolution |
| [validation-log.md](03-logs/validation-log.md) | Test runs and checkpoint verification |
| [insights.md](03-logs/insights.md) | Learnings and discoveries |

### 04-process: How to Work
**Purpose:** Development workflow and standards.

| File | Description |
|------|-------------|
| [dev-workflow.md](04-process/dev-workflow.md) | Stage-based development process |
| [definition-of-done.md](04-process/definition-of-done.md) | Completion criteria at each level |
| [llm-prompts.md](04-process/llm-prompts.md) | Effective prompts for Claude |

---

## Development Plans

The detailed stage-by-stage implementation plans are in `/plans`:

| Stage | Document | Focus | Status |
|-------|----------|-------|--------|
| Master | [MASTER-PLAN.md](../plans/MASTER-PLAN.md) | Overview and success criteria | |
| 0 | [STAGE-0-RESEARCH.md](../plans/STAGE-0-RESEARCH.md) | Research & discovery | ✓ |
| 1 | [STAGE-1-FOUNDATION.md](../plans/STAGE-1-FOUNDATION.md) | Project setup & database | ✓ |
| 2 | [STAGE-2-AUTH.md](../plans/STAGE-2-AUTH.md) | Authentication | ✓ |
| 3 | [STAGE-3-BANDS.md](../plans/STAGE-3-BANDS.md) | Band management | ✓ |
| 4 | [STAGE-4-EVENTS.md](../plans/STAGE-4-EVENTS.md) | Events & availability | ✓ |
| 5 | [STAGE-5-COMMUNICATION.md](../plans/STAGE-5-COMMUNICATION.md) | Communication | **Next** |
| 6 | [STAGE-6-TESTS.md](../plans/STAGE-6-TESTS.md) | Testing | - |
| 7 | [STAGE-7-UI.md](../plans/STAGE-7-UI.md) | Functional UI | - |
| 8 | [STAGE-8-POLISH.md](../plans/STAGE-8-POLISH.md) | Styling & polish | - |
| 9 | [STAGE-9-DEPLOY.md](../plans/STAGE-9-DEPLOY.md) | Deployment | - |

---

## Getting Started

### New to the project?
1. Read [00-context/vision.md](00-context/vision.md)
2. Review [01-product/prd.md](01-product/prd.md)
3. Check [00-context/system-state.md](00-context/system-state.md) for current status

### Ready to develop?
1. Read [04-process/dev-workflow.md](04-process/dev-workflow.md)
2. Open the current stage plan in `/plans`
3. Follow the stage tasks and checkpoints

### Need feature details?
1. Browse [02-features/](02-features/)
2. Each feature has specs and technical design

### Tracking progress?
1. Update [03-logs/implementation-log.md](03-logs/implementation-log.md)
2. Log decisions in [03-logs/decisions-log.md](03-logs/decisions-log.md)
3. Update [00-context/system-state.md](00-context/system-state.md) at checkpoints

---

## Tech Stack Reference

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase |
| Database | PostgreSQL |
| Auth | Supabase Auth (Google OAuth) |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage |
| Hosting | Vercel |

---

## Key Decisions

See [03-logs/decisions-log.md](03-logs/decisions-log.md) for full ADRs.

| Decision | Summary |
|----------|---------|
| DEC-001 | Use Supabase for backend |
| DEC-002 | Use Next.js App Router |
| DEC-003 | Dark theme default |
| DEC-004 | Include availability polling |
| DEC-005 | Include file storage |
| DEC-006 | Defense-in-depth security pattern |
| DEC-007 | Open redirect protection |
| DEC-008 | JSONB type casting pattern |
| DEC-009 | Nullable foreign key guards |
| DEC-010 | FormData file upload pattern |

---

## Security Status

**Audit Complete:** 21 vulnerabilities fixed (2026-02-01)

| Area | Status |
|------|--------|
| Server Actions | 16+ functions secured with auth/authz |
| RLS Policies | 17 policies added |
| OAuth | Open redirect protection |

See [02-features/security/](02-features/security/) for full documentation.

---

*Last updated: 2026-02-01*
