# Decisions Log

Track architectural and design decisions with context and rationale.

---

## Format

```markdown
## [ID] - [Decision Title]
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by [ID]

### Context
What prompted this decision?

### Decision
What was decided?

### Rationale
Why this approach?

### Alternatives Considered
What else was evaluated?

### Consequences
What are the implications?
```

---

## Decisions

### DEC-001 - Use Supabase for Backend
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Need a backend solution that provides auth, database, real-time, and storage with minimal setup and free tier for MVP.

#### Decision
Use Supabase as the complete backend platform.

#### Rationale
- All-in-one solution (auth, database, realtime, storage)
- PostgreSQL with Row Level Security
- Built-in real-time subscriptions
- Generous free tier
- TypeScript support
- @supabase/ssr for Next.js integration

#### Alternatives Considered
- **Firebase:** Good real-time but NoSQL, weaker TypeScript support
- **Custom backend:** Too much overhead for MVP
- **PlanetScale + Clerk + custom:** More pieces to integrate

#### Consequences
- Vendor lock-in to Supabase
- Limited by Supabase free tier initially
- Must design around RLS patterns

---

### DEC-002 - Use Next.js App Router
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Need a React framework for building the frontend with server-side rendering and API routes.

#### Decision
Use Next.js 15 with App Router.

#### Rationale
- Server Components for better performance
- Server Actions for form handling
- Built-in routing and layouts
- Excellent Vercel deployment
- Strong TypeScript support

#### Alternatives Considered
- **Pages Router:** Older pattern, less efficient
- **Remix:** Good but smaller ecosystem
- **SvelteKit:** Different ecosystem

#### Consequences
- Must follow App Router conventions
- Some learning curve for Server Components
- Locked into Vercel-optimized patterns

---

### DEC-003 - Dark Theme Default
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Need to choose a visual direction for the application.

#### Decision
Dark theme by default with purple (#8b5cf6) accent color, inspired by Linear.

#### Rationale
- Musicians often prefer dark themes
- Reduces eye strain during late rehearsals
- Modern, professional aesthetic
- Purple evokes creativity/music

#### Alternatives Considered
- **Light theme default:** Less modern feel
- **System preference:** More complexity

#### Consequences
- Must ensure contrast accessibility
- All components styled for dark mode
- May add light mode toggle later

---

### DEC-004 - Availability Polling Feature
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Research revealed When2Meet-style polling is common in band coordination.

#### Decision
Add availability polling as MVP feature.

#### Rationale
- Competitor analysis showed this is expected
- Reduces scheduling friction
- Differentiates from basic chat apps
- Natural integration with events

#### Alternatives Considered
- **Defer to v2:** Would miss key use case
- **Calendar integration:** More complex

#### Consequences
- Additional database tables
- More complex UI (grid interface)
- Worth the added value

---

### DEC-005 - File Storage Feature
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Bands need to share recordings, setlists, and documents.

#### Decision
Add file storage using Supabase Storage.

#### Rationale
- Natural fit with Supabase platform
- Signed URLs for security
- Essential for band coordination
- Differentiation from chat apps

#### Alternatives Considered
- **Link to external storage:** Less integrated
- **No file storage:** Missing key feature

#### Consequences
- Storage RLS policies needed
- 50MB file size limit
- Storage costs at scale

---

### DEC-006 - Security Remediation Pattern
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Security audit identified 21 vulnerabilities across Stages 2-5 including missing auth checks, open redirect, and incomplete RLS policies.

#### Decision
Implement defense-in-depth security with both server action validation AND RLS policies.

#### Rationale
- Server actions: First line of defense, user-friendly errors
- RLS policies: Database-level security, blocks direct API attacks
- Defense-in-depth: If one layer fails, the other protects
- Consistent auth pattern across all server actions

#### Security Pattern Applied
```typescript
export async function someAction(resourceId: string) {
  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 2. Validate input
  if (!resourceId) throw new Error('Invalid input')

  // 3. Check authorization (membership/admin)
  // 4. Perform operation
}
```

#### Alternatives Considered
- **RLS only:** User-unfriendly errors, harder to debug
- **Server actions only:** Vulnerable to direct Supabase API calls
- **Middleware-based auth:** Less granular control

#### Consequences
- Some code duplication between server actions and RLS
- More secure than either approach alone
- Clear, consistent error messages
- All 8 server actions follow same pattern

---

### DEC-007 - Open Redirect Protection
**Date:** 2026-02-01
**Status:** Accepted

#### Context
OAuth callback accepted arbitrary `next` parameter, allowing redirect to external sites.

#### Decision
Validate redirect paths before use with strict path checking.

#### Rationale
- Prevents phishing attacks via OAuth flow
- Simple validation function
- Falls back to /dashboard on invalid path

#### Implementation
```typescript
function isValidPath(path: string): boolean {
  return path.startsWith('/') &&
         !path.startsWith('//') &&
         !path.includes('://') &&
         !path.includes('\\')
}
```

#### Consequences
- External redirect URLs rejected
- Users always land on valid app routes
- Minimal performance impact

---

### DEC-008 - JSONB Type Casting Pattern
**Date:** 2026-02-01
**Status:** Accepted

#### Context
TypeScript strict typing with Supabase-generated types caused issues with JSONB fields (date_options, available_slots, metadata).

#### Decision
Use `as unknown as Json` for inserts and `as unknown as SpecificType[]` for reads.

#### Rationale
- Supabase types define JSONB as generic `Json` type
- Our code uses specific interfaces (DateOption[], number[])
- Double cast preserves type safety while satisfying compiler
- Consistent pattern across all JSONB operations

#### Implementation
```typescript
// Insert
date_options: input.dateOptions as unknown as Json

// Read
const dateOptions = poll.date_options as unknown as DateOption[]
```

#### Consequences
- Explicit type handling at JSONB boundaries
- Runtime still needs Array.isArray() checks
- Clear pattern for future JSONB fields

---

### DEC-009 - Nullable Foreign Key Guards
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Database foreign keys (band_id, event_id, etc.) are nullable in schema but should always have values for valid records. TypeScript required handling null case.

#### Decision
Add `!entity.band_id` to null guards, narrowing type for subsequent use.

#### Rationale
- Satisfies TypeScript strict null checks
- Guards against truly orphaned records
- Single check handles both null entity and null foreign key
- No runtime overhead for valid data

#### Implementation
```typescript
if (!event || !event.band_id) throw new Error('Event not found')
// Now event.band_id is string (not string | null)
```

#### Consequences
- Consistent null handling pattern
- Better TypeScript inference
- Clearer error messages
- Minimal code overhead

---

### DEC-010 - FormData File Upload Pattern
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Server actions can't directly accept File objects from client. Need pattern for file uploads.

#### Decision
Provide two functions: `uploadFile()` for metadata-only and `uploadFileWithStorage()` for full FormData upload.

#### Rationale
- Server actions support FormData natively
- Separating concerns allows flexibility
- Client can handle upload progress if needed
- Rollback on failure (delete storage if DB insert fails)

#### Implementation
```typescript
export async function uploadFileWithStorage(formData: FormData) {
  const file = formData.get('file') as File
  // 1. Upload to Supabase Storage
  // 2. Create database record
  // 3. Rollback storage on DB failure
}
```

#### Consequences
- Flexible upload patterns
- Atomic operations (rollback on failure)
- Client can choose upload strategy
- Clear separation of concerns

---

### DEC-011 - Consistent Membership Checks for All Functions
**Date:** 2026-02-01
**Status:** Accepted

#### Context
During Stage 4 code review, we found that functions accessing "user's own data" (getUserRsvp, getUserAvailability, removeRsvp) skipped membership verification because they only return/modify the user's own records and RLS provides database-level protection.

#### Decision
ALL server action functions must verify band membership, regardless of whether they access user-specific data or not.

#### Rationale
- Maintains defense-in-depth pattern (DEC-006) consistently
- Prevents information leakage about band/event existence
- Makes authorization logic predictable and auditable
- RLS is a backup, not a replacement for app-layer checks

#### Implementation
```typescript
// ALWAYS include this pattern, even for user-specific queries:
const { data: event } = await supabase
  .from('events')
  .select('band_id')
  .eq('id', eventId)
  .single()

if (!event || !event.band_id) throw new Error('Event not found')

const { data: member } = await supabase
  .from('band_members')
  .select('id')
  .eq('band_id', event.band_id)
  .eq('user_id', user.id)
  .single()

if (!member) throw new Error('Access denied')
```

#### Consequences
- Consistent security pattern across all functions
- Small performance overhead (2 additional queries)
- Predictable behavior for all server actions
- 100% security pattern compliance (22/22)

---

### DEC-012 - Real-time Subscription Pattern
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Stage 5 required real-time messaging. Needed a pattern for subscribing to Supabase postgres_changes that properly handles React component lifecycle.

#### Decision
Create custom hook `useRealtimeMessages` that manages subscription lifecycle with proper cleanup.

#### Rationale
- Encapsulates subscription logic in reusable hook
- Handles INSERT and DELETE events
- Cleans up channel on unmount (prevents memory leaks)
- Client-side filtering for null thread_id (Supabase realtime doesn't support is.null filter)
- Supabase client is singleton, excluded from useEffect deps

#### Implementation
```typescript
export function useRealtimeMessages(bandId: string, threadId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    // Subscribe to INSERT/DELETE events
    // Filter client-side for main chat

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandId, threadId])  // Exclude supabase (singleton)

  return messages
}
```

#### Consequences
- Clean API for consuming components
- Proper resource cleanup
- Real-time updates without polling
- Requires Supabase realtime to be enabled on messages table

---

### DEC-013 - Input Validation Consistency
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Stage 5 code review found that communication server actions lacked the input validation pattern established in Stage 4 security hardening (type guards, length limits).

#### Decision
All server actions must include both type guards AND length limits on user-controlled string inputs.

#### Rationale
- Defense-in-depth: prevents both type coercion attacks and DoS via large payloads
- Consistent pattern makes security audits easier
- User-friendly error messages for invalid input
- Database protection even if schema validation is bypassed

#### Implementation
```typescript
// Type guards
if (!bandId || typeof bandId !== 'string') throw new Error('Invalid band ID')
if (!content || typeof content !== 'string') throw new Error('Invalid content')

// Length limits
if (title.length > 200) throw new Error('Title too long (max 200)')
if (content.length > 5000) throw new Error('Content too long (max 5000)')

// Numeric limits for pagination
if (typeof limit !== 'number' || limit < 1 || limit > 500) {
  throw new Error('Invalid limit (must be 1-500)')
}
```

#### Standard Limits
| Field | Max Length |
|-------|------------|
| title | 200 |
| content/description | 5000 |
| location | 500 |
| limit parameter | 1-500 |

#### Consequences
- All 33 server actions now follow same validation pattern
- Predictable error messages
- Small performance overhead for validation
- 100% input validation compliance

---

### DEC-014 - RLS Infinite Recursion Fix with SECURITY DEFINER
**Date:** 2026-02-01
**Status:** Accepted

#### Context
During Stage 6 testing, RLS policy on `band_members` table caused infinite recursion error. The policy checked if user was a band member by querying `band_members`, which triggered the same policy check, creating an infinite loop.

Original policy:
```sql
CREATE POLICY "Members can view band members" ON band_members
FOR SELECT USING (
  band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
);
```

#### Decision
Create a `SECURITY DEFINER` function to perform the membership check, bypassing RLS during the check itself.

#### Rationale
- `SECURITY DEFINER` functions execute with the privileges of the function owner
- This allows the function to query `band_members` without triggering RLS
- Common pattern for breaking RLS recursion in PostgreSQL
- Function is marked `STABLE` for query optimizer efficiency

#### Implementation
```sql
-- Function that bypasses RLS
CREATE OR REPLACE FUNCTION is_band_member(p_band_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM band_members
    WHERE band_id = p_band_id AND user_id = p_user_id
  );
$$;

-- Policy uses function instead of subquery
CREATE POLICY "Members can view band members"
  ON band_members FOR SELECT
  USING (is_band_member(band_id, auth.uid()));
```

#### Alternatives Considered
- **Materialized view:** More complex, overkill for this use case
- **Application-level only:** Would remove database-level security
- **Separate roles table:** Unnecessary schema change

#### Consequences
- RLS recursion eliminated
- Function executes with elevated privileges (security consideration)
- `SET search_path = public` prevents search path attacks
- Pattern can be reused for other recursive RLS scenarios

---

### DEC-015 - Test Infrastructure with Vitest and Playwright
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Stage 6 required comprehensive integration tests for all 33 server actions before building UI. Needed both unit/integration tests and E2E browser tests.

#### Decision
Use Vitest for unit/integration tests and Playwright for E2E tests.

#### Rationale
- **Vitest:** Fast, Vite-native, excellent TypeScript support, compatible with Testing Library
- **Playwright:** Cross-browser E2E, good dev experience, official Microsoft support
- Both work well with Supabase's JavaScript client
- Tests run against real Supabase database (not mocked)

#### Implementation
- `vitest.config.ts` - Node environment, path aliases, 30s timeout
- `playwright.config.ts` - Chromium, 60s timeout, requires dev server
- `tests/setup.ts` - Supabase client factory
- `tests/helpers.ts` - Auth helpers, test data factories
- Test pattern: `test.skipIf(!process.env.TEST_USER_EMAIL)` for auth-dependent tests

#### Test Structure
| Suite | Tests | Purpose |
|-------|-------|---------|
| auth.test.ts | 8 | Auth flow validation |
| bands.test.ts | 12 | Band CRUD, invitations |
| events.test.ts | 15 | Events, RSVPs |
| communication.test.ts | 20 | Announcements, threads, messages |
| e2e/navigation.spec.ts | 3 | Page navigation |
| e2e/full-flow.spec.ts | 8 | Complete user journeys |

#### Consequences
- Tests require real Supabase project
- Some tests skip without TEST_USER_* credentials
- E2E tests require running dev server
- 55 Vitest tests + 11 Playwright tests total

---

### DEC-016 - Comprehensive RLS Policy Fixes for Testing
**Date:** 2026-02-01
**Status:** Accepted

#### Context
During Stage 6 integration testing with authenticated test users, multiple RLS policy gaps were discovered that prevented the test suite from passing.

#### Issues Found
1. **Band creation flow:** INSERT succeeded but SELECT failed (user not yet a member)
2. **Band members:** Missing INSERT/UPDATE/DELETE policies
3. **Events:** Missing UPDATE/DELETE policies
4. **Invitations:** SELECT policy accessed `auth.users` directly, causing permission error

#### Decision
Apply 4 additional migrations to fix all RLS gaps using SECURITY DEFINER functions to safely access auth.users.

#### Implementation
```sql
-- Helper functions (SECURITY DEFINER bypasses RLS)
CREATE FUNCTION is_band_admin(p_band_id UUID, p_user_id UUID)
CREATE FUNCTION get_user_email(p_user_id UUID)

-- Bands: Allow creators to see their bands immediately after insert
CREATE POLICY "Members or creators can view bands"
  USING (created_by = auth.uid() OR id IN (SELECT ...))

-- Invitations: Use helper function instead of direct auth.users access
CREATE POLICY "Users can view invitations sent to their email"
  USING (email = get_user_email(auth.uid()) OR ...)
```

#### Migrations Applied
| # | Name | Purpose |
|---|------|---------|
| 21 | fix_all_rls_policies | Bands + band_members CRUD |
| 22 | fix_remaining_rls | Events UPDATE/DELETE, helper functions |
| 23 | fix_invitations_select_policy | Invitations SELECT via helper |
| 24 | add_invitations_unique_constraint | Prevent duplicate pending invitations |

#### Consequences
- All 56 Vitest tests now pass
- RLS coverage complete for all CRUD operations
- SECURITY DEFINER functions handle auth.users access safely
- Unique partial index prevents duplicate pending invitations

---

### DEC-017 - Vitest Version Downgrade
**Date:** 2026-02-01
**Status:** Accepted

#### Context
Vitest 4.0.18 (latest) caused "No test suite found" errors on Windows, preventing any tests from running.

#### Decision
Downgrade to Vitest 2.1.9 which works reliably on Windows.

#### Rationale
- Vitest 4.x is very new and has known Windows issues (GitHub issues #7465, #2962)
- Vitest 2.1.9 is stable and well-tested
- Removed @vitejs/plugin-react from config (not needed for server-side tests)

#### Consequences
- Tests run successfully on Windows
- CJS deprecation warning appears but doesn't affect functionality
- May upgrade to Vitest 4.x when Windows issues are resolved

---

*Add new decisions at the bottom with incrementing ID*
