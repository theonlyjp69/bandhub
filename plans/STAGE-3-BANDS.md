# Stage 3: Band Management Backend

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are building **BandHub**. Authentication works (Stage 2). Now you build the server actions for band management.

**Prerequisites:** Stage 2 complete, auth working.

**Research References:**
- [Task Management Patterns](C:\Users\jpcoo\docs\research\task-management-patterns.md) - Role-based permissions patterns
- [Competitor Analysis](C:\Users\jpcoo\docs\research\competitor-analysis.md) - Band member management approaches

---

## Your Goal

Create all server actions for:
1. Band CRUD
2. Member management
3. Invitation system

**No UI yet.** Backend only. Test via direct function calls.

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `supabase` MCP | Query database |
| `context7` MCP | Next.js server actions docs |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Write server actions |
| `quality-assurance` | Review code |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/review` | Code review |
| `/security` | Check for vulnerabilities |
| `/verification-before-completion` | Test all actions |

---

## Task 3.1: Create Band Server Actions

**Create:** `actions/bands.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createBand(name: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Create band
  const { data: band, error } = await supabase
    .from('bands')
    .insert({ name, description, created_by: user.id })
    .select()
    .single()

  if (error) throw error

  // Add creator as admin
  await supabase
    .from('band_members')
    .insert({ band_id: band.id, user_id: user.id, role: 'admin' })

  return band
}

export async function getUserBands() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('bands')
    .select(`
      *,
      band_members!inner(user_id)
    `)
    .eq('band_members.user_id', user.id)

  if (error) throw error
  return data
}

export async function getBand(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bands')
    .select('*')
    .eq('id', bandId)
    .single()

  if (error) throw error
  return data
}
```

**Test:**
- Call `createBand('Test Band')` → band appears in database
- Call `getUserBands()` → returns the created band
- Call `getBand(id)` → returns correct band

---

## Task 3.2: Member Management Server Actions

**Create:** `actions/members.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function getBandMembers(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('band_members')
    .select(`
      *,
      profiles(id, display_name, avatar_url)
    `)
    .eq('band_id', bandId)

  if (error) throw error
  return data
}

export async function updateMemberRole(memberId: string, role: 'admin' | 'member') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('band_members')
    .update({ role })
    .eq('id', memberId)

  if (error) throw error
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('band_members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
}
```

**Test:**
- `getBandMembers(bandId)` → returns members with profiles
- `updateMemberRole(id, 'member')` → role changes
- Only admins can update/remove (RLS should block others)

---

## Task 3.3: Invitation Server Actions

**Create:** `actions/invitations.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createInvitation(bandId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      band_id: bandId,
      email,
      invited_by: user.id,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserInvitations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get user's email from profile or auth
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      bands(id, name),
      profiles!invited_by(display_name)
    `)
    .eq('status', 'pending')

  if (error) throw error
  return data
}

export async function acceptInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get invitation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (!invitation) throw new Error('Invitation not found')

  // Add user to band
  await supabase
    .from('band_members')
    .insert({
      band_id: invitation.band_id,
      user_id: user.id,
      role: 'member'
    })

  // Update invitation status
  await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId)
}

export async function declineInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)

  if (error) throw error
}
```

**Test Full Invitation Flow:**
1. User A creates band
2. User A creates invitation for user B's email
3. User B logs in
4. User B calls `getUserInvitations()` → sees pending invite
5. User B calls `acceptInvitation(id)`
6. User B is now in `band_members`
7. User B can now see the band via `getUserBands()`

---

## Checkpoint 3: Band Management Backend

```
✓ createBand() creates band and adds creator as admin
✓ getUserBands() returns only user's bands
✓ getBand() returns single band
✓ getBandMembers() returns members with profiles
✓ updateMemberRole() changes roles (admin only)
✓ removeMember() removes members (admin only)
✓ createInvitation() creates pending invite
✓ getUserInvitations() returns user's pending invites
✓ acceptInvitation() adds user to band, updates status
✓ declineInvitation() updates status without adding user
✓ RLS blocks unauthorized actions
```

**Test with two users:**
1. User A creates band
2. User A invites User B
3. User B accepts
4. Both users can see the band
5. Only User A (admin) can invite more people

**Use:** `/verification-before-completion` skill
**Use:** `quality-assurance` agent

**Commit:** "Implement band management server actions"

**Next Stage:** [STAGE-4-EVENTS.md](./STAGE-4-EVENTS.md)
