# Stage 0: Research & Discovery

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are starting a new project called **BandHub** - a band management web app. Before writing any code, you must research the landscape to make informed decisions.

**Read the master plan first:** [MASTER-PLAN.md](./MASTER-PLAN.md)

---

## Your Goal

Research competitors, best practices, and open source resources. Document findings. Recommend changes to the plan based on research.

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `WebSearch` | Search the web for information |
| `WebFetch` | Read web pages |
| `Bash` (gh CLI) | Search GitHub repos: `gh search repos "query"` |
| `Bash` (npm) | Search packages: `npm search query` |
| `shadcn-ui` MCP | Research UI components |
| `context7` MCP | Look up library documentation |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `market-researcher` | Analyze competitors, identify gaps, synthesize findings |
| `ui-designer` | Research UI/UX patterns, recommend design direction |
| `system-architect` | Propose technical changes based on research |

---

## Tasks

### Task 0.1: Competitor Research

**Search for:** Band management apps (BandHelper, Bandcamp, Setlist.fm, Stageit, BandMix)

**Document:**
- What features do they have?
- What do they charge?
- What are their strengths/weaknesses?
- What gaps can we fill?

**Output:** `docs/03-logs/research/competitor-analysis.md`

---

### Task 0.2: Task Management Patterns

**Search for:** Trello, Asana, Notion, Linear, Monday.com

**Document:**
- How do they organize tasks/projects?
- Board vs list vs timeline views
- What works for small teams?

**Output:** `docs/03-logs/research/task-management-patterns.md`

---

### Task 0.3: Event/Calendar Patterns

**Search for:** Google Calendar, Calendly, When2Meet, Doodle

**Document:**
- Best calendar UI patterns
- How do they handle RSVPs?
- Availability polling approaches
- Recurring events

**Output:** `docs/03-logs/research/event-management-patterns.md`

---

### Task 0.4: UI/UX Research

**Search for:** Linear, Notion, Vercel dashboard designs

**Use:** `shadcn-ui` MCP to explore components

**Document:**
- Design principles to follow
- Color palette recommendations
- Typography guidelines
- Navigation patterns
- Dark mode approach

**Output:** `docs/03-logs/research/ui-ux-guidelines.md`

---

### Task 0.5: Communication Patterns

**Search for:** Slack, Discord, Teams

**Document:**
- Thread vs channel structures
- Notification patterns
- Presence indicators
- Message formatting

**Output:** `docs/03-logs/research/communication-patterns.md`

---

### Task 0.6: GitHub & NPM Research

**Run these searches:**

```bash
gh search repos "nextjs supabase starter" --limit 20 --sort stars
gh search repos "react calendar component" --limit 20 --sort stars
gh search repos "supabase realtime chat" --limit 20
gh search repos "nextjs shadcn template" --limit 20 --sort stars

npm search react-calendar
npm search @supabase
```

**Document:**
- Starter templates to use
- Calendar components to integrate
- Chat libraries to consider
- NPM packages to add
- License compatibility

**Output:** `docs/03-logs/research/github-resources.md`

---

## Checkpoint 0

Before proceeding, verify:

```
✓ competitor-analysis.md exists and is complete
✓ task-management-patterns.md exists and is complete
✓ event-management-patterns.md exists and is complete
✓ ui-ux-guidelines.md exists and is complete
✓ communication-patterns.md exists and is complete
✓ github-resources.md exists and is complete
```

---

## After Research: Synthesis

**Use agent:** `market-researcher`

Create `docs/03-logs/research/research-synthesis.md` answering:

1. **New features to add?** What did competitors have that we should include?
2. **Features to remove?** What's unnecessary for MVP?
3. **Design direction?** What visual style fits best?
4. **Open source to use?** Which templates/libraries should we integrate?
5. **Schema changes?** Do we need new database tables?

---

## User Approval Required

Present your recommendations to the user using `AskUserQuestion`:

- New features to add
- Features to defer to v2
- Design direction
- Open source integrations
- Any schema changes

**Do not proceed to Stage 1 until user approves the research synthesis.**

---

## When Complete

1. All 6 research documents exist in `docs/03-logs/research/`
2. `research-synthesis.md` summarizes recommendations
3. User has approved the recommendations
4. Update the master plan if features changed

**Next Stage:** [STAGE-1-FOUNDATION.md](./STAGE-1-FOUNDATION.md)
