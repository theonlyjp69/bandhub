# Security Feature Specification

## Overview

BandHub implements defense-in-depth security with server action validation AND Row Level Security (RLS) policies. This ensures data protection even if one layer is bypassed.

## Security Architecture

```
User Request
     │
     ▼
┌─────────────────┐
│  Server Action  │  ← Authentication check
│    Validation   │  ← Authorization check (membership/admin)
└────────┬────────┘  ← Input validation
         │
         ▼
┌─────────────────┐
│  Supabase RLS   │  ← Database-level security
│    Policies     │  ← Blocks direct API attacks
└────────┬────────┘
         │
         ▼
    Database
```

## Authentication Pattern

All server actions follow this pattern:

```typescript
export async function someAction(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Authentication
  if (!user) throw new Error('Not authenticated')

  // 2. Input validation
  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid input')
  }

  // 3. Authorization (varies by function)
  // - Membership check: User belongs to the band
  // - Admin check: User has admin role in the band
  // - Self-check: User owns the resource (e.g., own invitation)

  // 4. Perform operation
}
```

## Protected Server Actions

| Function | File | Authorization Level |
|----------|------|---------------------|
| `getBand()` | actions/bands.ts | Auth + membership |
| `getBandMembers()` | actions/members.ts | Auth + membership |
| `updateMemberRole()` | actions/members.ts | Auth + admin |
| `removeMember()` | actions/members.ts | Auth + admin OR self |
| `createInvitation()` | actions/invitations.ts | Auth + admin |
| `getUserInvitations()` | actions/invitations.ts | Auth + email filter |
| `acceptInvitation()` | actions/invitations.ts | Auth + email match |
| `declineInvitation()` | actions/invitations.ts | Auth + email match |

## RLS Policies

### Migration File
`supabase/migrations/20260201000012_security_remediation.sql`

### Policies by Table

| Table | Operations | Authorization |
|-------|------------|---------------|
| profiles | INSERT | Own profile only |
| band_members | INSERT | Via invitation or as creator |
| band_members | UPDATE | Admin of band |
| band_members | DELETE | Admin or self-removal |
| bands | UPDATE | Admin of band |
| bands | DELETE | Creator only |
| invitations | UPDATE | Invitee (own email) |
| invitations | DELETE | Admin of band |
| events | UPDATE/DELETE | Creator or admin |
| availability_polls | UPDATE/DELETE | Creator or admin |
| announcements | UPDATE/DELETE | Creator or admin |
| threads | UPDATE | Creator only |
| threads | DELETE | Creator or admin |
| messages | UPDATE | Own messages |
| messages | DELETE | Own or admin |
| files | UPDATE | Uploader only |

## OAuth Security

### Open Redirect Protection

Location: `app/auth/callback/route.ts`

```typescript
function isValidPath(path: string): boolean {
  return path.startsWith('/') &&
         !path.startsWith('//') &&
         !path.includes('://') &&
         !path.includes('\\')
}
```

**Blocked patterns:**
- `//evil.com` (protocol-relative)
- `https://evil.com` (absolute URL)
- `\evil.com` (backslash tricks)

## Error Messages

User-friendly errors that don't leak information:

| Error | Meaning |
|-------|---------|
| "Not authenticated" | No valid session |
| "Invalid input" | Bad parameter format |
| "Access denied" | Not a member of band |
| "Admin required" | Action requires admin role |
| "Member not found" | Invalid member ID |
| "Invitation not found" | Invalid invitation ID |
| "This invitation is not for you" | Email mismatch |
| "Invitation already processed" | Status not pending |
| "Operation failed" | Database error (generic) |

## Security Audit Status

**Completed:** 2026-02-01
**Vulnerabilities Found:** 21
**Vulnerabilities Fixed:** 21

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 5 | Fixed |
| High | 8 | Fixed |
| Medium | 5 | Fixed |
| Low | 3 | Fixed |

See [Security Audit Logs](../../03-logs/security/implementation-logs/security-audit-logs/) for details.

## Testing Security

### Manual Tests

1. **Unauthenticated access:**
   ```
   Call getBand() without session → "Not authenticated"
   ```

2. **Unauthorized access:**
   ```
   Non-member calls getBand(bandId) → "Access denied"
   ```

3. **Admin-only action:**
   ```
   Member calls updateMemberRole() → "Admin required"
   ```

4. **Open redirect:**
   ```
   /auth/callback?next=//evil.com → Redirects to /dashboard
   ```

5. **Invitation email mismatch:**
   ```
   User A accepts User B's invitation → "not for you"
   ```

## Future Considerations

- Rate limiting on server actions
- CSRF protection (built into Next.js Server Actions)
- Content Security Policy headers
- Audit logging for sensitive operations
