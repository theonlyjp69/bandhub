# Development Workflow

## Overview

BandHub follows a stage-based development workflow with checkpoints and validation at each stage.

---

## Development Stages

```
STAGE 0: Research & Discovery
    ↓ Checkpoint: Research approved
STAGE 1: Project Foundation & Database
    ↓ Checkpoint: Schema complete
STAGE 2: Authentication
    ↓ Checkpoint: Auth working
STAGE 3: Band Management Backend
    ↓ Checkpoint: Actions tested
STAGE 4: Events & Availability Backend
    ↓ Checkpoint: Actions tested
STAGE 5: Communication Backend
    ↓ Checkpoint: Real-time working
STAGE 6: Integration Tests
    ↓ Checkpoint: All tests pass
STAGE 7: Functional UI
    ↓ Checkpoint: Features usable
STAGE 8: Polish & Styling
    ↓ Checkpoint: Design complete
STAGE 9: Deploy
    ↓ Checkpoint: Production verified
```

---

## Stage Workflow

### 1. Read Stage Document
- Open `plans/STAGE-{N}-{NAME}.md`
- Understand context and prerequisites
- Review tools and agents available
- Read all tasks before starting

### 2. Execute Tasks
For each task:
1. Read task requirements
2. Implement solution
3. Test according to task criteria
4. Commit when task complete

### 3. Checkpoint Validation
- Complete all checkpoint criteria
- Run validation tests
- Request user approval
- Update validation log

### 4. Proceed to Next Stage
Only after checkpoint passes:
- Update system-state.md
- Log in implementation-log.md
- Begin next stage document

---

## Tools by Stage

| Stage | Primary Tools |
|-------|--------------|
| 0 | WebSearch, WebFetch, gh CLI |
| 1 | supabase MCP, Bash |
| 2 | supabase MCP, context7 MCP |
| 3-5 | supabase MCP, code-developer |
| 6 | playwright MCP, Vitest |
| 7 | context7 MCP, code-developer |
| 8 | shadcn-ui MCP, ui-designer |
| 9 | vercel MCP, playwright MCP |

---

## Commit Conventions

### Format
```
<type>: <description>

[optional body]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Styling changes
- `refactor`: Code restructuring
- `test`: Test additions
- `chore`: Maintenance

### Examples
```
feat: Implement Google OAuth authentication
fix: Correct RLS policy for band members
docs: Add feature specification for events
test: Add E2E tests for invitation flow
chore: Update dependencies
```

---

## Branch Strategy

### For MVP (solo development)
- Work directly on `main`
- Commit after each completed task
- Tag releases at major checkpoints

### For Team (future)
```
main          (production)
  └── develop (integration)
       ├── feature/auth
       ├── feature/events
       └── fix/rls-policy
```

---

## File Organization

```
bandhub/
├── app/                  # Next.js App Router
│   ├── (app)/           # Protected routes
│   │   ├── dashboard/
│   │   └── band/[id]/
│   ├── login/
│   └── auth/callback/
├── actions/             # Server actions
├── components/          # React components
│   ├── ui/             # shadcn components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utilities
│   └── supabase/       # Supabase clients
├── types/              # TypeScript types
├── docs/               # Documentation
├── plans/              # Development plans
└── tests/              # Test files
```

---

## Quality Gates

### Before Commit
- [ ] Code compiles without errors
- [ ] TypeScript has no errors
- [ ] Related tests pass
- [ ] Functionality verified manually

### Before Checkpoint
- [ ] All stage tasks complete
- [ ] All checkpoint criteria met
- [ ] Security review if applicable
- [ ] Documentation updated

### Before Deploy
- [ ] All stages complete
- [ ] All tests pass
- [ ] Security audit passed
- [ ] Production environment configured

---

## Communication

### Progress Updates
- Update `docs/03-logs/implementation-log.md` after each task
- Update `docs/00-context/system-state.md` at checkpoints
- Log decisions in `docs/03-logs/decisions-log.md`

### Issues
- Log bugs in `docs/03-logs/bug-log.md`
- Create GitHub issues for tracking (when repo exists)

### Reviews
- Use `/review` skill for code review
- Use `/security` skill for security audit
- Request user approval at checkpoints

---

*Reference: [plans/MASTER-PLAN.md](../../plans/MASTER-PLAN.md)*
