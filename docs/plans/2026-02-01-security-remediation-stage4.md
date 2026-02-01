# Stage 4 Security Remediation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 7 security vulnerabilities identified in Stage 4 audit (2 CRITICAL, 3 HIGH, 2 MEDIUM)

**Architecture:** Apply defense-in-depth fixes at server action layer (validation, sanitization, limits) and database layer (storage RLS policy). No UI changes required.

**Tech Stack:** TypeScript, Supabase (PostgreSQL RLS, Storage), Next.js Server Actions

---

## Summary of Issues

| Priority | Issue | Location | Task |
|----------|-------|----------|------|
| CRITICAL | Path traversal in file upload | files.ts:225 | Task 1 |
| CRITICAL | Storage DELETE policy mismatch | storage policy | Task 2 |
| HIGH | JSONB array content validation | availability.ts:131 | Task 3 |
| HIGH | Array bounds in getBestTimeSlot | availability.ts:274 | Task 4 |
| HIGH | No file size limit | files.ts:209 | Task 5 |
| MEDIUM | MIME type validation | files.ts:244 | Task 5 |
| MEDIUM | String/array length limits | availability.ts, events.ts | Task 6 |

---

## Task 1: Fix Path Traversal Vulnerability (CRITICAL)

**Files:**
- Modify: `actions/files.ts:223-226`

**Risk:** Attacker could craft filename like `../../etc/passwd` to escape directory

**Step 1: Replace weak sanitization with secure pattern**

In `actions/files.ts`, replace lines 223-226:

```typescript
  // Generate unique file path: band_id/timestamp_filename
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${bandId}/${timestamp}_${safeName}`
```

With:

```typescript
  // Generate unique file path with secure filename sanitization
  const timestamp = Date.now()
  // Extract only the base filename (no path components)
  const baseName = file.name.split(/[/\\]/).pop() || 'file'
  // Remove all dangerous characters and path traversal sequences
  const safeName = baseName
    .replace(/\.\./g, '_')           // Remove path traversal
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Allow only safe chars
    .replace(/^\.+/, '_')             // Don't start with dots
    .substring(0, 100)                // Limit filename length
  const filePath = `${bandId}/${timestamp}_${safeName}`

  // Final validation: ensure path stays within band directory
  if (filePath.includes('..') || !filePath.startsWith(`${bandId}/`)) {
    throw new Error('Invalid filename')
  }
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Compiled successfully

**Step 3: Commit**

```bash
git add actions/files.ts
git commit -m "security: Fix path traversal vulnerability in file upload

- Remove path traversal sequences (..)
- Extract base filename only (no path components)
- Limit filename to 100 characters
- Final validation ensures path stays in band directory

Fixes CRITICAL security issue from Stage 4 audit"
```

---

## Task 2: Fix Storage DELETE Policy (CRITICAL)

**Files:**
- Create: `supabase/migrations/20260201000014_fix_storage_delete_policy.sql`

**Risk:** Admins can delete files from database but not from storage (orphaned files)

**Step 1: Create migration to update storage DELETE policy**

Create file `supabase/migrations/20260201000014_fix_storage_delete_policy.sql`:

```sql
-- Fix storage DELETE policy to allow admins (matches server action logic)
-- Issue: Server action allows uploaders OR admins, but storage only allowed uploaders

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Uploaders can delete files" ON storage.objects;

-- Create new policy allowing uploaders OR band admins
CREATE POLICY "Uploaders or admins can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'band-files' AND
    (
      -- Uploaders can delete their own files
      auth.uid() = owner
      OR
      -- Band admins can delete any file in their band
      EXISTS (
        SELECT 1 FROM band_members
        WHERE band_id = (storage.foldername(name))[1]::uuid
        AND user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );
```

**Step 2: Verify migration syntax**

Run: `npx supabase db lint`
Expected: No errors

**Step 3: Commit**

```bash
git add supabase/migrations/20260201000014_fix_storage_delete_policy.sql
git commit -m "security: Fix storage DELETE policy for admin access

- Align storage.objects DELETE policy with server action authorization
- Admins can now delete any file in their band's storage
- Uploaders retain ability to delete own files

Fixes CRITICAL storage policy mismatch from Stage 4 audit"
```

---

## Task 3: Add JSONB Array Content Validation (HIGH)

**Files:**
- Modify: `actions/availability.ts:125-131`

**Risk:** Array could contain strings, objects, or negative numbers instead of valid slot indices

**Step 1: Add content validation after Array.isArray check**

In `actions/availability.ts`, replace lines 130-131:

```typescript
  if (!pollId) throw new Error('Poll ID required')
  if (!Array.isArray(availableSlots)) throw new Error('Invalid slots')
```

With:

```typescript
  if (!pollId) throw new Error('Poll ID required')
  if (!Array.isArray(availableSlots)) throw new Error('Invalid slots')

  // Validate array contents: must be non-negative integers
  if (!availableSlots.every(slot =>
    typeof slot === 'number' &&
    Number.isInteger(slot) &&
    slot >= 0 &&
    slot < 1000  // Reasonable upper bound
  )) {
    throw new Error('Invalid slot values')
  }
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Compiled successfully

**Step 3: Commit**

```bash
git add actions/availability.ts
git commit -m "security: Add JSONB array content validation for availability slots

- Validate all slots are non-negative integers
- Reject strings, objects, floats, negative numbers
- Add reasonable upper bound (1000)

Fixes HIGH severity JSONB injection risk from Stage 4 audit"
```

---

## Task 4: Add Array Bounds Check in getBestTimeSlot (HIGH)

**Files:**
- Modify: `actions/availability.ts:268-277`

**Risk:** Accessing dateOptions[bestSlot] without bounds check could return undefined

**Step 1: Add bounds validation before returning**

In `actions/availability.ts`, replace lines 268-277:

```typescript
  if (bestSlot === -1) return null

  const dateOptions = poll.date_options as unknown as DateOption[]

  return {
    slotIndex: bestSlot,
    dateOption: dateOptions[bestSlot],
    respondentCount: maxCount,
    totalMembers: responses.length
  }
```

With:

```typescript
  if (bestSlot === -1) return null

  const dateOptions = poll.date_options as unknown as DateOption[]

  // Validate slot index is within bounds
  if (!Array.isArray(dateOptions) || bestSlot >= dateOptions.length) {
    return null  // Invalid poll data or corrupted responses
  }

  return {
    slotIndex: bestSlot,
    dateOption: dateOptions[bestSlot],
    respondentCount: maxCount,
    totalMembers: responses.length
  }
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Compiled successfully

**Step 3: Commit**

```bash
git add actions/availability.ts
git commit -m "security: Add array bounds check in getBestTimeSlot

- Validate dateOptions is an array
- Ensure bestSlot index is within array bounds
- Return null for invalid/corrupted data instead of undefined access

Fixes HIGH severity array bounds issue from Stage 4 audit"
```

---

## Task 5: Add File Size and MIME Type Validation (HIGH + MEDIUM)

**Files:**
- Modify: `actions/files.ts:198-212`

**Risk:**
- No file size limit allows DoS via large uploads
- Accepting any MIME type could cause downstream issues

**Step 1: Add constants and validation at top of uploadFileWithStorage**

In `actions/files.ts`, after line 211 (`if (!file || !bandId || !name) {`), add validation:

Replace lines 209-211:

```typescript
  if (!file || !bandId || !name) {
    throw new Error('Missing required fields')
  }
```

With:

```typescript
  if (!file || !bandId || !name) {
    throw new Error('Missing required fields')
  }

  // File size limit: 50MB (matches Supabase free tier)
  const MAX_FILE_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large (max 50MB)')
  }

  // Allowed MIME types for band files
  const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'video/mp4', 'video/webm',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('File type not allowed')
  }
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Compiled successfully

**Step 3: Commit**

```bash
git add actions/files.ts
git commit -m "security: Add file size limit and MIME type validation

- Enforce 50MB max file size (matches Supabase free tier)
- Restrict uploads to common document/media types
- Prevents DoS via large files and malicious file types

Fixes HIGH (size limit) and MEDIUM (MIME type) issues from Stage 4 audit"
```

---

## Task 6: Add String/Array Length Limits (MEDIUM)

**Files:**
- Modify: `actions/availability.ts:25-35` (createAvailabilityPoll)
- Modify: `actions/events.ts:30-45` (createEvent)

**Risk:** Unbounded input sizes could cause performance degradation

**Step 1: Add limits to createAvailabilityPoll**

In `actions/availability.ts`, after `if (!input.bandId || !input.title || !input.dateOptions)`:

Find and replace the validation block (around lines 25-35):

```typescript
  if (!input.bandId || !input.title || !input.dateOptions) {
    throw new Error('Missing required fields')
  }
```

With:

```typescript
  if (!input.bandId || !input.title || !input.dateOptions) {
    throw new Error('Missing required fields')
  }

  // Input length limits
  if (input.title.length > 200) throw new Error('Title too long (max 200)')
  if (input.description && input.description.length > 2000) throw new Error('Description too long (max 2000)')
  if (input.dateOptions.length > 50) throw new Error('Too many date options (max 50)')
```

**Step 2: Add limits to createEvent**

In `actions/events.ts`, after the existing validation, add length checks:

Find the validation block (around lines 30-45) and add after `throw new Error('Missing required fields')`:

```typescript
  // Input length limits
  if (input.title.length > 200) throw new Error('Title too long (max 200)')
  if (input.description && input.description.length > 5000) throw new Error('Description too long (max 5000)')
  if (input.location && input.location.length > 500) throw new Error('Location too long (max 500)')
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Compiled successfully

**Step 4: Commit**

```bash
git add actions/availability.ts actions/events.ts
git commit -m "security: Add input length limits for events and polls

- Title: max 200 characters
- Description: max 2000-5000 characters
- Location: max 500 characters
- Date options: max 50 per poll

Fixes MEDIUM severity input validation from Stage 4 audit"
```

---

## Task 7: Final Verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Compiled successfully

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Update security audit log**

Create/update security audit documentation with fixed issues.

**Step 4: Final commit with all verification**

```bash
git add .
git commit -m "docs: Complete Stage 4 security remediation

Fixed 7 vulnerabilities:
- CRITICAL: Path traversal in file upload
- CRITICAL: Storage DELETE policy mismatch
- HIGH: JSONB array content validation
- HIGH: Array bounds in getBestTimeSlot
- HIGH: File size limit (50MB)
- MEDIUM: MIME type validation
- MEDIUM: Input length limits

All builds and lints pass."
```

---

## Verification Checklist

| Issue | Fixed | Verified |
|-------|-------|----------|
| Path traversal | Task 1 | `npm run build` |
| Storage DELETE policy | Task 2 | Migration created |
| JSONB array validation | Task 3 | `npm run build` |
| Array bounds check | Task 4 | `npm run build` |
| File size limit | Task 5 | `npm run build` |
| MIME type validation | Task 5 | `npm run build` |
| Input length limits | Task 6 | `npm run build` |

---

## Parallel Execution Strategy

Tasks 1, 3-4, and 5-6 modify different functions and can be executed by parallel agents:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   AGENT 1       │  │   AGENT 2       │  │   AGENT 3       │
│                 │  │                 │  │                 │
│ Task 1: Path    │  │ Task 3: JSONB   │  │ Task 5: File    │
│ traversal       │  │ validation      │  │ size/MIME       │
│ (files.ts)      │  │ (availability)  │  │ (files.ts)      │
│                 │  │                 │  │                 │
│ Task 2: Storage │  │ Task 4: Bounds  │  │ Task 6: Length  │
│ policy (SQL)    │  │ check           │  │ limits          │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Task 7: VERIFY  │
                    │   npm run build   │
                    │   npm run lint    │
                    └───────────────────┘
```

---

*Plan created: 2026-02-01*
*Author: Claude Code (superpowers:writing-plans)*
