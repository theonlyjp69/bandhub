# BandHub Documentation

5-tier documentation hierarchy for optimal navigation and context.

---

## Quick Links

| I want to... | Go to... |
|--------------|----------|
| Understand the project | [00-context/vision.md](00-context/vision.md) |
| See product requirements | [01-product/prd.md](01-product/prd.md) |
| Read feature specs | [02-features/](02-features/) |
| Check current status | [00-context/system-state.md](00-context/system-state.md) |
| Learn the workflow | [04-process/dev-workflow.md](04-process/dev-workflow.md) |
| See development plans | [../plans/MASTER-PLAN.md](../plans/MASTER-PLAN.md) |

---

## Current Status

**Stage 8 Complete** → Ready for **Stage 9: Deploy**

✓ Research | ✓ Foundation | ✓ Auth | ✓ Bands | ✓ Events | ✓ Communication | ✓ Tests | ✓ UI | ✓ Polish | **Deploy**

---

## Documentation Structure

```
docs/
├── 00-context/              # WHY and WHAT EXISTS
│   ├── vision.md           # Project vision and goals
│   ├── assumptions.md      # Technical and business assumptions
│   └── system-state.md     # Current status + design tokens
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
│   ├── communication/      # Chat, threads, announcements
│   ├── notifications/      # In-app, push, preferences
│   └── security/           # Security requirements
│
├── 03-logs/                 # ACTIVE LOGS
│   ├── decisions-log.md       # ADRs (DEC-001 to DEC-010)
│   ├── insights.md            # Learnings
│   └── research/              # UI guidelines, design patterns
│
├── 04-process/              # HOW to work
│   ├── dev-workflow.md        # Development process
│   ├── definition-of-done.md  # Completion criteria
│   └── storage-conventions.md # File storage patterns
│
├── archive/                 # HISTORICAL (34 files)
│   ├── implementation-logs/   # Stage 4-8 implementation logs
│   ├── code-reviews/          # Stage 1-8 code reviews
│   ├── security-audits/       # Security audit logs
│   ├── research/              # Old research files
│   └── stage-plans/           # Completed stage plans (0-8)
│
└── README.md               # This file
```

---

## Tier Descriptions

### 00-context: Project Context
| File | Description |
|------|-------------|
| [vision.md](00-context/vision.md) | Product vision, target users, competitive position |
| [assumptions.md](00-context/assumptions.md) | Technical constraints, business assumptions |
| [system-state.md](00-context/system-state.md) | Current status, design tokens, UI modernization details |

### 01-product: Product Definition
| File | Description |
|------|-------------|
| [prd.md](01-product/prd.md) | Complete Product Requirements Document |

### 02-features: Feature Documentation
| Feature | Path |
|---------|------|
| Authentication | [auth/](02-features/auth/) |
| Band Management | [bands/](02-features/bands/) |
| Events & Calendar | [events/](02-features/events/) |
| Availability | [availability/](02-features/availability/) |
| File Storage | [files/](02-features/files/) |
| Communication | [communication/](02-features/communication/) |
| Notifications | [notifications/](02-features/notifications/) |
| Security | [security/](02-features/security/) |

### 03-logs: Active Logs
| File | Description |
|------|-------------|
| [decisions-log.md](03-logs/decisions-log.md) | Architecture Decision Records |
| [insights.md](03-logs/insights.md) | Learnings and discoveries |
| [research/ui-ux-guidelines.md](03-logs/research/ui-ux-guidelines.md) | UI/UX design guidelines |
| [research/ui-modernization-research.md](03-logs/research/ui-modernization-research.md) | Design system research |

### 04-process: How to Work
| File | Description |
|------|-------------|
| [dev-workflow.md](04-process/dev-workflow.md) | Stage-based development process |
| [definition-of-done.md](04-process/definition-of-done.md) | Completion criteria |
| [storage-conventions.md](04-process/storage-conventions.md) | File storage patterns |

---

## Development Plans

| Plan | Description |
|------|-------------|
| [MASTER-PLAN.md](../plans/MASTER-PLAN.md) | Overview and success criteria |
| [STAGE-9-DEPLOY.md](../plans/STAGE-9-DEPLOY.md) | Current stage: Deployment |

*Completed stage plans (0-8) are in [archive/stage-plans/](archive/stage-plans/)*

---

## Getting Started

**New to the project?**
1. Read [vision.md](00-context/vision.md)
2. Review [prd.md](01-product/prd.md)
3. Check [system-state.md](00-context/system-state.md)

**Ready to develop?**
1. Read [dev-workflow.md](04-process/dev-workflow.md)
2. Open the current stage plan
3. Follow tasks and checkpoints

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), Tailwind, shadcn/ui |
| Backend | Supabase (auth, database, realtime, storage) |
| Database | PostgreSQL + RLS |
| Hosting | Vercel |

---

*Last updated: 2026-02-04*
