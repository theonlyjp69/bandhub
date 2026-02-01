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

*Add new decisions at the bottom with incrementing ID*
