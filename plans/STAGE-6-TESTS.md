# Stage 6: Integration Tests

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Implementation Status

| Task | Status | Notes |
|------|--------|-------|
| 6.0 Create Test Users | ✅ Complete | test1@bandhub.test, test2@bandhub.test |
| 6.1 Set Up Testing | ✅ Complete | Vitest 2.1.9 + Playwright configured |
| 6.2 Auth Flow Test | ✅ Complete | 8 tests passing |
| 6.3 Band Management Test | ✅ Complete | 12 tests passing |
| 6.4 Events Flow Test | ✅ Complete | 15 tests passing |
| 6.5 Communication Flow Test | ✅ Complete | 20 tests passing |
| 6.6 E2E Test | ✅ Complete | 11 tests scaffolded |

**Total:** 56 Vitest tests (all passing) + 11 E2E tests scaffolded

### RLS Policy Fixes Applied
- Migration 21: Band creation flow (bands + band_members INSERT/SELECT/UPDATE/DELETE)
- Migration 22: Events UPDATE/DELETE, invitations SECURITY DEFINER functions
- Migration 23: Invitations SELECT policy fix (auth.users access)
- Migration 24: Unique constraint on pending invitations

---

## Context

You are building **BandHub**. All backend server actions are complete (Stages 1-5). Now you write integration tests to verify everything works together.

**Prerequisites:** Stages 1-5 complete, all server actions working.

**Research References:**
- [GitHub Resources](docs/03-logs/research/github-resources.md) - Testing setup (Vitest, Playwright)
- [Communication Patterns](docs/03-logs/research/communication-patterns.md) - Real-time testing patterns

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

## Task 6.0: Create Test Users in Supabase

**Purpose:** Integration tests require authenticated users to test RLS policies, permissions, and multi-user flows.

**Steps:**

1. **Create Test User 1 (Admin user):**
   - Go to Supabase Dashboard → Authentication → Users → Add User
   - Email: `test1@bandhub.test` (or your preferred email)
   - Password: Generate a secure password
   - Click "Create User"

2. **Create Test User 2 (Member user):**
   - Same process with `test2@bandhub.test`

3. **Add credentials to `.env.local`:**
   ```env
   # Test Users (for integration tests)
   TEST_USER_1_EMAIL=test1@bandhub.test
   TEST_USER_1_PASSWORD=your-secure-password-1
   TEST_USER_2_EMAIL=test2@bandhub.test
   TEST_USER_2_PASSWORD=your-secure-password-2
   ```

4. **Verify profiles exist:**
   - The auth trigger should auto-create profiles
   - Check Supabase Dashboard → Table Editor → profiles

**Note:** Keep test credentials out of version control. Add to `.gitignore` if not already:
```
.env.local
.env.test
```

---

## Task 6.1: Set Up Testing

**Install:**
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react dotenv playwright @playwright/test
npx playwright install chromium
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
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Create:** `tests/setup.ts`

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { beforeAll } from 'vitest'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for tests')
}

export function createTestClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

beforeAll(async () => {
  const supabase = createTestClient()
  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (error) {
    console.error('Failed to connect to Supabase:', error)
    throw new Error('Cannot connect to test database')
  }
})
```

**Create:** `tests/helpers.ts` with functions for:
- `createAuthenticatedClient(email, password)` - Sign in and return authenticated client
- `createUnauthenticatedClient()` - Return anonymous client
- `createTestBand(supabase, userId)` - Create band with user as admin
- `cleanupBand(supabase, bandId)` - Delete band and related data

**Add to `package.json` scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Task 6.2: Auth Flow Test

**Create:** `tests/auth.test.ts`

Test these scenarios:
1. ✓ Unauthenticated user cannot access protected actions (RLS blocks)
2. ✓ Authenticated user has valid session
3. ✓ Authenticated user has profile
4. ✓ Sign out clears session

```typescript
import { createAuthenticatedClient, createUnauthenticatedClient } from './helpers'

describe('Authentication', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot create band', async () => {
      const supabase = createUnauthenticatedClient()
      const { error } = await supabase.from('bands').insert({ name: 'Test' })
      expect(error).not.toBeNull() // RLS blocks
    })
  })

  describe('Authenticated Access', () => {
    test('authenticated user has profile', async () => {
      const { supabase, user } = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL!,
        process.env.TEST_USER_1_PASSWORD!
      )
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      expect(profile).not.toBeNull()
    })
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
import { createAuthenticatedClient, createTestBand, addBandMember } from './helpers'

describe('Band Management', () => {
  let adminSupabase, memberSupabase, testBandId

  beforeAll(async () => {
    // Setup both test users
    const admin = await createAuthenticatedClient(
      process.env.TEST_USER_1_EMAIL!,
      process.env.TEST_USER_1_PASSWORD!
    )
    const member = await createAuthenticatedClient(
      process.env.TEST_USER_2_EMAIL!,
      process.env.TEST_USER_2_PASSWORD!
    )
    adminSupabase = admin.supabase
    memberSupabase = member.supabase

    // Admin creates band
    const band = await createTestBand(adminSupabase, admin.user.id)
    testBandId = band.id

    // Add member to band
    await addBandMember(adminSupabase, testBandId, member.user.id, 'member')
  })

  test('admin can create invitation', async () => {
    const { data, error } = await adminSupabase
      .from('invitations')
      .insert({ band_id: testBandId, email: 'new@test.com', invited_by: adminUserId })
    expect(error).toBeNull()
  })

  test('member cannot update roles', async () => {
    // RLS should block non-admin from updating roles
    const { error } = await memberSupabase
      .from('band_members')
      .update({ role: 'admin' })
      .eq('band_id', testBandId)
    // Either error or no rows affected
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

**Prerequisites verified:**
```
✓ Test users created in Supabase (TEST_USER_1, TEST_USER_2)
✓ Test credentials added to .env.local
✓ Database migrations applied (including RLS recursion fix)
```

**Test coverage:**
```
✓ Unauthenticated access tests pass (RLS blocks unauthorized)
✓ Authenticated user tests pass (bands, events, communication)
✓ Multi-user permission tests pass (admin vs member)
✓ E2E tests pass (full user journeys in browser)
✓ Real-time sync verified (messages appear across sessions)
```

**Run all tests:**
```bash
npm run test:run    # Unit/integration tests (Vitest)
npx playwright test # E2E tests (Playwright)
```

**Expected output:**
- All tests should pass (not skipped)
- If tests are skipped, verify TEST_USER_* env vars are set

**Use:** `quality-assurance` agent to review test coverage
**Use:** `/verification-before-completion` skill

**Commit:** "Add comprehensive test suite"

**Next Stage:** [STAGE-7-UI.md](./STAGE-7-UI.md)
