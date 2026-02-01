# Stage 6: Integration Tests

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are building **BandHub**. All backend server actions are complete (Stages 1-5). Now you write integration tests to verify everything works together.

**Prerequisites:** Stages 1-5 complete, all server actions working.

**Research References:**
- [GitHub Resources](C:\Users\jpcoo\docs\research\github-resources.md) - Testing setup (Vitest, Playwright)
- [Communication Patterns](C:\Users\jpcoo\docs\research\communication-patterns.md) - Real-time testing patterns

---

## Your Goal

Write integration tests for all major user flows. Verify the backend is solid before building UI.

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `Bash` | Run tests |
| `playwright` MCP | Browser automation for E2E tests |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Write test code |
| `quality-assurance` | Review test coverage |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/test-driven-development` | Test writing guidance |
| `/verification-before-completion` | Verify all tests pass |

---

## Task 6.1: Set Up Testing

**Install:**
```bash
npm install -D vitest @testing-library/react playwright
npx playwright install
```

**Create:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

---

## Task 6.2: Auth Flow Test

**Create:** `tests/auth.test.ts`

Test these scenarios:
1. ✓ Unauthenticated user cannot access protected actions
2. ✓ After OAuth, user has session
3. ✓ Profile is auto-created on signup
4. ✓ Sign out clears session

```typescript
describe('Authentication', () => {
  test('unauthenticated user cannot create band', async () => {
    // Should throw 'Not authenticated'
  })

  test('profile is created on signup', async () => {
    // After OAuth, check profiles table
  })
})
```

---

## Task 6.3: Band Management Flow Test

**Create:** `tests/bands.test.ts`

Test the complete flow:
1. User A creates band → becomes admin
2. User A invites User B
3. User B sees pending invitation
4. User B accepts invitation
5. User B is now a member
6. Both users can see the band
7. Only User A (admin) can invite more people

```typescript
describe('Band Management', () => {
  test('create band makes user admin', async () => {
    const band = await createBand('Test Band')
    const members = await getBandMembers(band.id)
    expect(members[0].role).toBe('admin')
  })

  test('invitation flow works end-to-end', async () => {
    // Full flow test
  })

  test('non-admin cannot invite', async () => {
    // RLS should block
  })
})
```

---

## Task 6.4: Events Flow Test

**Create:** `tests/events.test.ts`

Test:
1. Create event with all fields
2. RSVP as different statuses
3. Update RSVP (upsert works)
4. Get event shows all RSVPs
5. Delete event cascades RSVPs

```typescript
describe('Events', () => {
  test('create event with show metadata', async () => {
    const event = await createEvent({
      bandId,
      title: 'Big Show',
      eventType: 'show',
      startTime: '2024-06-01T20:00:00Z',
      metadata: { venue: 'The Venue', pay: 500 }
    })
    expect(event.metadata.venue).toBe('The Venue')
  })

  test('RSVP upsert works', async () => {
    await setRsvp(eventId, 'going')
    await setRsvp(eventId, 'maybe')  // Should update, not create second
    const rsvps = await getEventRsvps(eventId)
    expect(rsvps.length).toBe(1)
    expect(rsvps[0].status).toBe('maybe')
  })
})
```

---

## Task 6.5: Communication Flow Test

**Create:** `tests/communication.test.ts`

Test:
1. Only admins can create announcements
2. Thread creation and message replies
3. Main chat vs thread messages are separate
4. Real-time subscription receives new messages

```typescript
describe('Communication', () => {
  test('only admin can create announcement', async () => {
    // Admin: should work
    // Member: should throw
  })

  test('messages separate by thread', async () => {
    await sendMessage(bandId, 'Main chat')
    await sendMessage(bandId, 'Thread message', threadId)

    const mainMessages = await getMessages(bandId)
    const threadMessages = await getMessages(bandId, threadId)

    expect(mainMessages.length).toBe(1)
    expect(threadMessages.length).toBe(1)
  })
})
```

---

## Task 6.6: E2E Test with Playwright

**Create:** `tests/e2e/full-flow.spec.ts`

Full end-to-end browser test:

```typescript
import { test, expect } from '@playwright/test'

test('complete user journey', async ({ page, context }) => {
  // 1. Login
  await page.goto('/login')
  // ... OAuth flow

  // 2. Create band
  await page.goto('/create-band')
  await page.fill('[name="name"]', 'Test Band')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/band\//)

  // 3. Create event
  // 4. RSVP
  // 5. Send message
  // 6. Verify real-time in second browser context
})

test('real-time messaging', async ({ browser }) => {
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  // Login both users
  // Both navigate to same band chat
  // User 1 sends message
  // Verify message appears in User 2's page

  await page1.fill('[name="message"]', 'Hello from User 1')
  await page1.click('button[type="submit"]')

  await expect(page2.locator('text=Hello from User 1')).toBeVisible()
})
```

**Use:** `playwright` MCP to run these tests

---

## Checkpoint 6: Backend Complete & Tested

```
✓ All unit tests pass
✓ All integration tests pass
✓ E2E tests pass
✓ Real-time sync verified in browser
✓ RLS policies verified (unauthorized actions blocked)
✓ Edge cases handled (empty states, errors)
```

**Run all tests:**
```bash
npm run test        # Unit/integration tests
npx playwright test # E2E tests
```

**All tests must pass before proceeding.**

**Use:** `quality-assurance` agent to review test coverage
**Use:** `/verification-before-completion` skill

**Commit:** "Add comprehensive test suite"

**Next Stage:** [STAGE-7-UI.md](./STAGE-7-UI.md)
