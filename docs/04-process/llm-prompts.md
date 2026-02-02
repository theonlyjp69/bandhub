# LLM Prompts & Patterns

Effective prompts and patterns for working with Claude on BandHub.

---

## Starting a Session

### Context Loading
```
I'm working on BandHub, a band coordination web app.

Key context:
- Tech stack: Next.js 15, Supabase, Tailwind, shadcn/ui
- Current stage: [STAGE-X]
- Last completed: [brief description]

Please read: plans/STAGE-X-NAME.md
```

### Resuming Work
```
Continuing BandHub development.

Status:
- Stage: [current stage]
- Task: [current task]
- Blockers: [any issues]

Let's continue from [specific point].
```

---

## Stage-Specific Prompts

### Stage 0: Research
```
Let's do competitor research for BandHub.

Search for band management apps and document:
1. Features they have
2. Pricing models
3. Strengths/weaknesses
4. Gaps we can fill

Reference: docs/03-logs/research/competitor-analysis.md
```

### Stage 1: Foundation
```
Set up the BandHub database schema.

Using Supabase MCP, create these tables with RLS:
- profiles
- bands
- band_members
- invitations

Follow the SQL in plans/STAGE-1-FOUNDATION.md
```

### Stage 2-5: Backend
```
Implement [feature] server actions.

Requirements:
- Use 'use server' directive
- Handle auth with getUser()
- Throw on errors
- Return typed data

Reference: plans/STAGE-X-NAME.md Task X.X
```

### Stage 6: Tests
```
Write integration tests for [feature].

Test scenarios:
1. Happy path
2. Auth required
3. RLS blocking unauthorized access
4. Edge cases

Use Vitest for unit tests, Playwright for E2E.
```

### Stage 7-8: UI
```
Build the UI for [feature].

Requirements:
- Use shadcn/ui components
- Dark theme default
- Mobile responsive
- Loading/error states

Reference feature spec: docs/02-features/[feature]/feature-spec.md
```

---

## Task Patterns

### Creating a Server Action
```
Create server action for [action name].

Input: [describe inputs]
Output: [describe output]
Security: [RLS/auth requirements]

Should handle:
- Auth check
- Input validation
- Error handling
- Return typed data
```

### Creating a UI Component
```
Create [component name] component.

Props: [list props]
State: [describe state]
Events: [describe handlers]

Use shadcn/ui [specific components].
Style with Tailwind for dark theme.
```

### Fixing a Bug
```
Debug issue: [description]

Symptoms:
- [what's happening]
- [expected vs actual]

Relevant files:
- [file paths]

Use /systematic-debugging skill.
```

---

## Quality Prompts

### Code Review
```
Review this code for:
1. TypeScript correctness
2. Security (RLS, auth)
3. Error handling
4. Performance
5. Code style

[paste code or file path]
```

### Security Audit
```
Security audit for [feature/stage].

Check:
- RLS policies complete
- No secrets exposed
- Auth properly enforced
- Input validated
- SQL injection prevented
```

### Pre-Deploy Check
```
Pre-deployment verification for BandHub.

Run through:
1. Build succeeds
2. All tests pass
3. Env vars configured
4. Auth URLs set
5. Security audit

Use /ship skill.
```

---

## MCP Tool Usage

### Supabase MCP
```
Using Supabase MCP:
1. apply_migration - Create table with SQL
2. execute_sql - Run SQL query
3. generate_typescript_types - Update types/database.ts
4. get_project - Check project status
```

### shadcn-ui MCP
```
Using shadcn-ui MCP:
1. list_components - See available components
2. get_component - Get component code
3. get_theme - Get theme configuration
```

### Playwright MCP
```
Using Playwright MCP:
1. Navigate to page
2. Fill forms
3. Click buttons
4. Assert content
5. Take screenshots
```

---

## Skill Invocations

```
/review - Code review current changes
/security - Security audit
/git-commit - Create commit with message
/test-generate - Generate tests for code
/systematic-debugging - Debug an issue
/verification-before-completion - Verify before marking done
```

---

## Agent Usage

```
Use code-developer agent for:
- Writing server actions
- Creating components
- Implementing features

Use quality-assurance agent for:
- Full code review
- Test coverage review
- Security audit

Use ui-designer agent for:
- Design decisions
- Component layout
- Responsive patterns
```

---

## Checkpoint Prompts

### Requesting Checkpoint Approval
```
Checkpoint [X.X] validation:

Criteria:
- [x] Criterion 1
- [x] Criterion 2
- [x] Criterion 3

Evidence:
- [test results]
- [screenshots if applicable]

Ready for approval to proceed to [next stage].
```

---

## Error Handling Prompts

### When Stuck
```
I'm stuck on [problem].

Tried:
1. [approach 1]
2. [approach 2]

Error message:
[paste error]

Relevant code:
[paste code]
```

### When Test Fails
```
Test failing: [test name]

Expected: [expected]
Actual: [actual]

Test code:
[paste test]

Implementation:
[paste implementation]
```

---

*Add effective prompts as you discover them*
