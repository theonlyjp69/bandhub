# Authentication Technical Design

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Login Page │────▶│   Google    │────▶│  Callback   │
│             │     │   OAuth     │     │   Route     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Middleware │◀────│  Supabase   │◀────│  Session    │
│  (protect)  │     │   Auth      │     │  Created    │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Database   │
                    │  Trigger    │
                    │  (profile)  │
                    └─────────────┘
```

## Files to Create

### 1. Supabase Clients
```
lib/supabase/
├── client.ts   # Browser client
└── server.ts   # Server client (cookies)
```

### 2. Auth Routes
```
app/
├── login/page.tsx           # Login page
└── auth/callback/route.ts   # OAuth callback
```

### 3. Middleware
```
middleware.ts   # Route protection
```

### 4. Server Actions
```
actions/
└── auth.ts     # signOut action
```

## Implementation Details

### Browser Client (`lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (`lib/supabase/server.ts`)
Uses @supabase/ssr with cookie handling for Next.js App Router.

### OAuth Callback (`app/auth/callback/route.ts`)
```typescript
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect('/dashboard')
  }
  return NextResponse.redirect('/login?error=auth_failed')
}
```

### Profile Trigger (SQL)
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

### Middleware (`middleware.ts`)
- Matches: `/dashboard/:path*`, `/band/:path*`
- Refreshes session
- Redirects to /login if no session

## Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x"
}
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

## Security Considerations

1. **PKCE Flow:** Supabase uses PKCE for OAuth security
2. **HTTP-Only Cookies:** Sessions stored in HTTP-only cookies
3. **RLS:** Database-level security enforced
4. **HTTPS:** Required for production OAuth

---

*Implementation: [plans/STAGE-2-AUTH.md](../../../plans/STAGE-2-AUTH.md)*
