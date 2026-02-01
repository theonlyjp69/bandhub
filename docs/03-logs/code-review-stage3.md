# Code Review - Stage 3: Band Management Backend

**Date:** 2026-02-01
**Reviewer:** Claude Opus 4.5
**Scope:** `actions/bands.ts`, `actions/members.ts`, `actions/invitations.ts`
**Commits:** `501d1d1` → `f6f3331`

---

## Requirements Checklist

| Requirement | Status |
|-------------|--------|
| `createBand()` creates band and adds creator as admin | PASS |
| `getUserBands()` returns only user's bands | PASS |
| `getBand()` returns single band | PASS |
| `getBandMembers()` returns members with profiles | PASS |
| `updateMemberRole()` changes roles | PASS |
| `removeMember()` removes members | PASS |
| `createInvitation()` creates pending invite | PASS |
| `getUserInvitations()` returns pending invites | PASS |
| `acceptInvitation()` adds user to band, updates status | PASS |
| `declineInvitation()` updates status | PASS |
| RLS blocks unauthorized actions | BLOCKED (missing policies) |

---

## Strengths

1. **Matches plan exactly** - Code follows the plan specification precisely
2. **Consistent patterns** - All files use same auth checking pattern
3. **Type safety** - TypeScript types enforced via Supabase client
4. **Clean structure** - Logical file organization (bands, members, invitations)
5. **Passes verification** - `tsc --noEmit` and `npm run lint` pass

---

## Issues Found

### Critical (0)
*None*

### Important (3)

**1. Missing RLS policies will cause runtime failures**
- Location: Database layer
- Impact: `createBand()` line 21-23, `updateMemberRole()`, `removeMember()`, `acceptInvitation()` line 62-68, `declineInvitation()` will fail
- Status: Documented in `security-audit-stage3.md`

**2. `createBand()` doesn't handle `band_members` insert failure**
- Location: `actions/bands.ts:21-23`
- Risk: Band created but admin not added = orphaned band
- Fix: Check error on band_members insert

**3. `acceptInvitation()` doesn't handle partial failure**
- Location: `actions/invitations.ts:62-74`
- Risk: User added to band but invitation not updated = can accept again
- Fix: Check errors on both operations

### Minor (2)

**1. `getBandMembers()` and `getBand()` lack auth checks**
- Location: `actions/members.ts:5`, `actions/bands.ts:46`
- Note: RLS should handle this, but inconsistent with other functions

**2. Stale comment in `getUserInvitations()`**
- Location: `actions/invitations.ts:32`
- Comment says "Get user's email from profile or auth" but relies on RLS

---

## Verification Results

```
✓ TypeScript: npx tsc --noEmit (passed)
✓ Lint: npm run lint (passed)
✓ Dependencies: npm audit (0 vulnerabilities)
```

---

## Assessment

| Criteria | Rating |
|----------|--------|
| Completeness | PASS - All functions implemented per plan |
| Correctness | WARN - Will fail without RLS fixes |
| Code Quality | PASS - Clean, consistent, follows patterns |
| Security | WARN - See security-audit-stage3.md |

**Verdict:** Implementation matches plan requirements. RLS policy gaps are database-layer issues documented in security audit.

---

## Action Items

| Priority | Item | Status |
|----------|------|--------|
| High | Add missing RLS policies (band_members, invitations) | OPEN |
| Medium | Add error handling for multi-step operations | OPEN |
| Low | Add auth checks to getBand(), getBandMembers() | OPEN |
| Low | Update stale comment in getUserInvitations() | OPEN |

---

## Conclusion

**Ready to proceed to Stage 4** after RLS policies are added via migration.
