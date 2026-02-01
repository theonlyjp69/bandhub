# Insights & Learnings

Capture discoveries, patterns, and knowledge gained during development.

---

## Format

```markdown
## [Category] - [Insight Title]
**Date:** YYYY-MM-DD

### Context
What prompted this insight?

### Learning
What was learned?

### Application
How can this be applied?

### References
- Link or source
```

---

## Technical Insights

### Supabase - RLS Pattern for Band Membership
**Date:** 2026-02-01

#### Context
Need to restrict data access to band members only across multiple tables.

#### Learning
Common RLS pattern for band membership:
```sql
USING (
  band_id IN (
    SELECT band_id FROM band_members
    WHERE user_id = auth.uid()
  )
)
```

#### Application
Apply this pattern to: events, messages, threads, announcements, files, polls

#### References
- [plans/STAGE-1-FOUNDATION.md](../../plans/STAGE-1-FOUNDATION.md)

---

### Next.js - Server Actions for Forms
**Date:** 2026-02-01

#### Context
Need pattern for form submissions in App Router.

#### Learning
Server Actions with 'use server' directive handle forms without API routes:
```typescript
'use server'
export async function createBand(formData: FormData) {
  const supabase = await createClient()
  // ... database operation
  revalidatePath('/dashboard')
}
```

#### Application
Use for all create/update operations

#### References
- [plans/STAGE-3-BANDS.md](../../plans/STAGE-3-BANDS.md)

---

### Supabase - Real-time Subscriptions
**Date:** 2026-02-01

#### Context
Need real-time chat without polling.

#### Learning
Supabase Realtime with postgres_changes:
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'messages',
    filter: `band_id=eq.${bandId}`
  }, callback)
  .subscribe()
```

Must enable replication: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

#### Application
Apply to messages table for real-time chat

#### References
- [plans/STAGE-5-COMMUNICATION.md](../../plans/STAGE-5-COMMUNICATION.md)

---

## Design Insights

### Linear-Inspired Dark Theme
**Date:** 2026-02-01

#### Context
Choosing visual direction for the app.

#### Learning
Linear's design principles that work well:
- Near-black backgrounds (#0a0a0a)
- Subtle borders (15% gray)
- Accent color for interactive elements
- Consistent 4px border radius
- Muted text for secondary content

#### Application
Apply to all UI components via shadcn/ui theming

#### References
- Research: UI/UX patterns

---

## Process Insights

### Stage-Based Development
**Date:** 2026-02-01

#### Context
Planning development approach for solo/small team.

#### Learning
Breaking development into stages with checkpoints:
1. Forces completion before moving on
2. Creates natural review points
3. Prevents scope creep
4. Makes progress measurable

#### Application
Follow 10-stage plan strictly, checkpoint before proceeding

#### References
- [plans/MASTER-PLAN.md](../../plans/MASTER-PLAN.md)

---

## User Insights

*To be added during research phase*

---

## Performance Insights

*To be added during implementation*

---

*Add new insights as they're discovered*
