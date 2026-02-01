# Stage 2: Authentication

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are building **BandHub**. The database is ready (Stage 1). Now you implement authentication with Google OAuth.

**Prerequisites:** Stage 1 complete, all tables created.

**Research References:**
- [GitHub Resources](C:\Users\jpcoo\docs\research\github-resources.md) - Supabase SSR auth helpers (@supabase/ssr)

---

## Your Goal

1. Configure Google OAuth in Supabase
2. Create auth callback route
3. Build auth middleware
4. Auto-create profile on signup

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `Bash` | Run commands |
| `supabase` MCP | Configure auth, execute SQL |
| `context7` MCP | Look up Supabase auth docs |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Write auth code |
| `quality-assurance` | Security review |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/security` | Auth security audit |
| `/review` | Code review |
| `/verification-before-completion` | Verify auth works |

---

## Task 2.1: Configure Google OAuth

**In Supabase Dashboard:**
1. Go to Authentication → Providers
2. Enable Google
3. Add Google OAuth credentials (Client ID, Secret)
4. Set redirect URL to `http://localhost:3000/auth/callback`

**Document the redirect URLs for production later.**

---

## Task 2.2: Create Auth Callback Route

**Create:** `app/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

**Test:** Trigger OAuth flow, verify callback receives code

---

## Task 2.3: Create Supabase Server Client

**Create:** `lib/supabase/server.ts`

Use `context7` MCP to get the latest Supabase SSR pattern.

**Test:** Import works, no TypeScript errors

---

## Task 2.4: Create Supabase Client (Browser)

**Create:** `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## Task 2.5: Create Auth Middleware

**Create:** `middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Refresh session and protect routes
  // Redirect to /login if not authenticated and accessing protected routes
}

export const config = {
  matcher: ['/dashboard/:path*', '/band/:path*']
}
```

**Test:**
- Unauthenticated user visiting /dashboard → redirected to /login
- Authenticated user visiting /dashboard → allowed through

---

## Task 2.6: Auto-Create Profile on Signup

**Option A: Database Trigger (Recommended)**

**Use:** `supabase` MCP → `execute_sql`

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Test:**
- Sign up new user with Google
- Check profiles table has new row
- Display name and avatar populated from Google

---

## Task 2.7: Create Login Page

**Create:** `app/login/page.tsx`

Simple page with "Sign in with Google" button.

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <button onClick={handleLogin}>
      Sign in with Google
    </button>
  )
}
```

**Test:** Click button, Google OAuth popup appears

---

## Task 2.8: Create Sign Out Function

**Create:** `actions/auth.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

**Test:** Sign out clears session, redirects to login

---

## Checkpoint 2: Authentication Complete

```
✓ Google OAuth configured in Supabase
✓ Auth callback route works
✓ Middleware protects /dashboard and /band routes
✓ Profile auto-created on signup
✓ Login page with Google button works
✓ Sign out clears session
✓ Session persists across page refreshes
```

**Full Test Flow:**
1. Visit /dashboard (should redirect to /login)
2. Click "Sign in with Google"
3. Complete Google OAuth
4. Should land on /dashboard
5. Check profiles table has new user
6. Refresh page (should stay logged in)
7. Sign out (should redirect to /login)
8. Visit /dashboard (should redirect to /login again)

**Use:** `quality-assurance` agent for auth security audit
**Use:** `/security` skill to review

**Commit:** "Implement Google OAuth authentication"

**Next Stage:** [STAGE-3-BANDS.md](./STAGE-3-BANDS.md)
