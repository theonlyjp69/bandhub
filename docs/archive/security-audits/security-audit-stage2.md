# Security Audit - Stage 2: Authentication

**Date:** 2026-02-01
**Scope:** Google OAuth authentication implementation
**Commit:** `501d1d1`
**Auditor:** Claude Opus 4.5

## Files Reviewed

| File | Purpose |
|------|---------|
| `actions/auth.ts` | Sign out server action |
| `app/auth/callback/route.ts` | OAuth callback handler |
| `app/login/page.tsx` | Login page with Google button |
| `app/dashboard/page.tsx` | Protected dashboard page |
| `middleware.ts` | Route protection middleware |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `supabase/migrations/20260201000011_create_auth_trigger.sql` | Profile auto-creation |

---

## Summary

| Severity | Count |
|----------|-------|
| **HIGH** | 0 |
| **MEDIUM** | 1 |
| **LOW** | 1 |
| **INFO** | 2 |

---

## MEDIUM Severity

### 1. Open Redirect in Auth Callback
**Location:** `app/auth/callback/route.ts:7`

**Risk:** The `next` parameter accepts any path without validation. An attacker could craft a malicious link that redirects users to a phishing site after authentication.

**Code:**
```typescript
const next = searchParams.get('next') ?? '/dashboard'
// ...
return NextResponse.redirect(`${origin}${next}`)
```

**Attack Vector:**
```
https://bandhub.com/auth/callback?code=xxx&next=//evil.com
https://bandhub.com/auth/callback?code=xxx&next=/\evil.com
```

**Remediation:**
```typescript
const next = searchParams.get('next') ?? '/dashboard'

// Validate relative path (no protocol, no double slashes)
const isSafe = next.startsWith('/') &&
               !next.startsWith('//') &&
               !next.includes('://') &&
               !next.includes('\\')
const safePath = isSafe ? next : '/dashboard'

return NextResponse.redirect(`${origin}${safePath}`)
```

**Status:** ✅ RESOLVED (2026-02-01) - Path validation added in `app/auth/callback/route.ts`

---

## LOW Severity

### 2. No Rate Limiting on Auth Endpoints
**Location:** `app/auth/callback/route.ts`, `app/login/page.tsx`

**Risk:** No rate limiting on authentication attempts. While OAuth limits brute force attacks, rapid repeated requests could:
- Consume API quota
- Enable enumeration attacks
- Cause service degradation

**Remediation:**
- Implement rate limiting via middleware or Vercel Edge Config
- Consider using Supabase's built-in rate limiting features

**Status:** OPEN (Low priority - OAuth mitigates most risks)

---

## INFO

### 3. Proper Use of SECURITY DEFINER
**Location:** `supabase/migrations/20260201000011_create_auth_trigger.sql:13`

**Status:** PASS

The `handle_new_user()` function correctly uses `SECURITY DEFINER` to allow the trigger to insert into `profiles` table with elevated privileges. This is necessary because the trigger runs in the context of the `auth.users` insert, which wouldn't normally have permission to write to `public.profiles`.

**Code:**
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** This is the correct pattern for auth triggers.

---

### 4. Session Management via Supabase SSR
**Location:** `middleware.ts`, `lib/supabase/server.ts`

**Status:** PASS

Session management follows Supabase SSR best practices:
- Cookies handled via `@supabase/ssr` package
- Session refresh in middleware
- `getUser()` used (validates with server, not just JWT)
- Proper cookie options passed through

---

## Passed Security Checks

| Check | File | Status | Notes |
|-------|------|--------|-------|
| **Authentication** |
| OAuth Implementation | `app/login/page.tsx` | ✅ PASS | Uses Supabase OAuth, no custom auth |
| Session Validation | `middleware.ts` | ✅ PASS | Uses `getUser()` not `getSession()` |
| Session Refresh | `middleware.ts` | ✅ PASS | Middleware refreshes tokens |
| Protected Routes | `middleware.ts` | ✅ PASS | `/dashboard/*`, `/band/*` protected |
| Sign Out | `actions/auth.ts` | ✅ PASS | Properly clears session |
| **Code Exchange** |
| PKCE Flow | Supabase handles | ✅ PASS | Supabase uses PKCE by default |
| Code Validation | `app/auth/callback/route.ts` | ✅ PASS | `exchangeCodeForSession()` validates |
| Error Handling | `app/auth/callback/route.ts` | ✅ PASS | Redirects to `/login?error=` on failure |
| **Client Security** |
| No Secrets in Client | `lib/supabase/client.ts` | ✅ PASS | Only uses public anon key |
| Environment Variables | `.env.local` | ✅ PASS | Properly gitignored |
| **Injection** |
| XSS in Login | `app/login/page.tsx` | ✅ PASS | React escapes output |
| XSS in Dashboard | `app/dashboard/page.tsx` | ✅ PASS | React escapes output |
| SQL Injection | All files | ✅ PASS | Supabase parameterized queries |
| **CSRF** |
| Server Actions | `actions/auth.ts` | ✅ PASS | Next.js built-in protection |
| OAuth State | Supabase handles | ✅ PASS | Supabase manages state param |

---

## Architecture Review

### Authentication Flow
```
1. User clicks "Sign in with Google"
   └─> Supabase redirects to Google OAuth

2. User authenticates with Google
   └─> Google redirects to Supabase callback

3. Supabase processes OAuth
   └─> Redirects to /auth/callback with code

4. App exchanges code for session
   └─> app/auth/callback/route.ts
   └─> supabase.auth.exchangeCodeForSession()

5. Session cookie set, redirect to /dashboard
   └─> Middleware validates on each request
```

### Session Validation Flow
```
1. Request to protected route (/dashboard)
   └─> middleware.ts intercepts

2. Middleware creates Supabase client
   └─> Reads cookies from request

3. Middleware calls getUser()
   └─> Validates session with Supabase server

4. If valid: proceed to route
   If invalid: redirect to /login
```

---

## Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | Fix open redirect in callback | Low |
| 2 | Add rate limiting (when deploying) | Medium |

---

## Positive Findings

1. **No Password Storage** - OAuth-only eliminates password management risks
2. **Server-Side Session Validation** - Uses `getUser()` not just JWT inspection
3. **Proper Cookie Handling** - Follows Supabase SSR patterns exactly
4. **Defense in Depth** - Middleware + server-side checks + RLS
5. **Clean Separation** - Server actions for mutations, client for reads

---

## Resolution Log

| Issue | Resolution | Date | Commit |
|-------|------------|------|--------|
| Open Redirect | Path validation added to auth callback | 2026-02-01 | Security remediation |

---

*Next audit: Stage 4 (Events & Availability)*
