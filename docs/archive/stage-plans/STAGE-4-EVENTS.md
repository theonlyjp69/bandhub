# Stage 4: Events, Availability & Files Backend

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are building **BandHub**. Band management works (Stage 3). Now you build the server actions for events, RSVPs, availability polling, and file storage.

**Prerequisites:** Stage 3 complete, bands/members/invitations working.

**Research References:**
- [Event Management Patterns](docs/03-logs/research/event-management-patterns.md) - Calendar and RSVP patterns
- [GitHub Resources](docs/03-logs/research/github-resources.md) - react-big-calendar, Supabase Storage

---

## Your Goal

Create all server actions for:
1. Event CRUD
2. RSVP management
3. Availability polling *(New - from research)*
4. File storage *(New - from research)*

**No UI yet.** Backend only.

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `supabase` MCP | Query database |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Write server actions |
| `quality-assurance` | Review code |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/review` | Code review |
| `/verification-before-completion` | Test all actions |

---

## Task 4.1: Event CRUD Server Actions

**Create:** `actions/events.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

interface CreateEventInput {
  bandId: string
  title: string
  eventType: 'show' | 'rehearsal' | 'deadline' | 'other'
  startTime: string
  endTime?: string
  location?: string
  description?: string
  metadata?: Record<string, any>  // venue, pay, load-in, etc.
}

export async function createEvent(input: CreateEventInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('events')
    .insert({
      band_id: input.bandId,
      title: input.title,
      event_type: input.eventType,
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location,
      description: input.description,
      metadata: input.metadata || {},
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(eventId: string, updates: Partial<CreateEventInput>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .update({
      title: updates.title,
      event_type: updates.eventType,
      start_time: updates.startTime,
      end_time: updates.endTime,
      location: updates.location,
      description: updates.description,
      metadata: updates.metadata
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

export async function getBandEvents(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_rsvps(user_id, status),
      profiles!created_by(display_name)
    `)
    .eq('band_id', bandId)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export async function getEvent(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_rsvps(
        user_id,
        status,
        profiles(display_name, avatar_url)
      ),
      profiles!created_by(display_name)
    `)
    .eq('id', eventId)
    .single()

  if (error) throw error
  return data
}

export async function getUpcomingEvents(bandId: string, limit = 5) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('band_id', bandId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}
```

**Test:**
- `createEvent()` → event appears in database
- `updateEvent()` → changes persist
- `deleteEvent()` → event removed
- `getBandEvents()` → returns all band events with RSVPs
- `getEvent()` → returns single event with details
- `getUpcomingEvents()` → returns future events only

---

## Task 4.2: RSVP Server Actions

**Create:** `actions/rsvps.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function setRsvp(eventId: string, status: 'going' | 'maybe' | 'not_going') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Upsert - create or update
  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      status
    }, {
      onConflict: 'event_id,user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEventRsvps(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_rsvps')
    .select(`
      *,
      profiles(id, display_name, avatar_url)
    `)
    .eq('event_id', eventId)

  if (error) throw error
  return data
}

export async function getUserRsvp(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error  // PGRST116 = no rows
  return data
}

export async function removeRsvp(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) throw error
}
```

**Test:**
- `setRsvp(eventId, 'going')` → RSVP created
- `setRsvp(eventId, 'maybe')` → RSVP updated (not duplicated)
- `getEventRsvps(eventId)` → returns all RSVPs with profiles
- `getUserRsvp(eventId)` → returns current user's RSVP
- `removeRsvp(eventId)` → RSVP deleted

---

## Task 4.3: Availability Polling Server Actions *(New - from research)*

See [Event Management Patterns](docs/03-logs/research/event-management-patterns.md) for When2Meet-style polling patterns.

**Create:** `actions/availability.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

interface DateOption {
  date: string         // ISO date
  start_time: string   // HH:MM
  end_time: string     // HH:MM
}

interface CreatePollInput {
  bandId: string
  title: string
  description?: string
  dateOptions: DateOption[]
  closesAt?: string
}

export async function createAvailabilityPoll(input: CreatePollInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('availability_polls')
    .insert({
      band_id: input.bandId,
      title: input.title,
      description: input.description,
      date_options: input.dateOptions,
      closes_at: input.closesAt,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getBandPolls(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('availability_polls')
    .select(`
      *,
      profiles!created_by(display_name),
      availability_responses(user_id)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPoll(pollId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('availability_polls')
    .select(`
      *,
      profiles!created_by(display_name),
      availability_responses(
        user_id,
        available_slots,
        profiles(display_name, avatar_url)
      )
    `)
    .eq('id', pollId)
    .single()

  if (error) throw error
  return data
}

export async function submitAvailability(pollId: string, availableSlots: number[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Upsert - create or update response
  const { data, error } = await supabase
    .from('availability_responses')
    .upsert({
      poll_id: pollId,
      user_id: user.id,
      available_slots: availableSlots
    }, {
      onConflict: 'poll_id,user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserAvailability(pollId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('availability_responses')
    .select('*')
    .eq('poll_id', pollId)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function deletePoll(pollId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('availability_polls')
    .delete()
    .eq('id', pollId)

  if (error) throw error
}

// Helper: Find best time slot (most responses)
export async function getBestTimeSlot(pollId: string) {
  const poll = await getPoll(pollId)
  if (!poll) return null

  const responses = poll.availability_responses || []
  const slotCounts: Record<number, number> = {}

  // Count responses per slot
  responses.forEach((response: any) => {
    response.available_slots.forEach((slotIndex: number) => {
      slotCounts[slotIndex] = (slotCounts[slotIndex] || 0) + 1
    })
  })

  // Find slot with most responses
  let bestSlot = -1
  let maxCount = 0
  Object.entries(slotCounts).forEach(([slot, count]) => {
    if (count > maxCount) {
      maxCount = count
      bestSlot = parseInt(slot)
    }
  })

  if (bestSlot === -1) return null

  return {
    slotIndex: bestSlot,
    dateOption: poll.date_options[bestSlot],
    respondentCount: maxCount,
    totalMembers: responses.length
  }
}
```

**Test:**
- `createAvailabilityPoll()` → poll created with date options
- `getBandPolls()` → returns all polls with response counts
- `getPoll()` → returns poll with all responses
- `submitAvailability()` → creates/updates response
- `getUserAvailability()` → returns current user's response
- `getBestTimeSlot()` → returns slot with most availability

---

## Task 4.4: File Storage Server Actions *(New - from research)*

**Create:** `actions/files.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

interface UploadFileInput {
  bandId: string
  name: string
  description?: string
  file: File
}

export async function uploadFile(input: UploadFileInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Generate unique file path: band_id/timestamp_filename
  const timestamp = Date.now()
  const safeName = input.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${input.bandId}/${timestamp}_${safeName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('band-files')
    .upload(filePath, input.file)

  if (uploadError) throw uploadError

  // Create database record
  const { data, error } = await supabase
    .from('files')
    .insert({
      band_id: input.bandId,
      name: input.name,
      description: input.description,
      file_path: filePath,
      file_size: input.file.size,
      mime_type: input.file.type,
      uploaded_by: user.id
    })
    .select(`
      *,
      profiles!uploaded_by(display_name)
    `)
    .single()

  if (error) throw error
  return data
}

export async function getBandFiles(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('files')
    .select(`
      *,
      profiles!uploaded_by(display_name, avatar_url)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getFileDownloadUrl(fileId: string) {
  const supabase = await createClient()

  // Get file record
  const { data: file, error } = await supabase
    .from('files')
    .select('file_path')
    .eq('id', fileId)
    .single()

  if (error) throw error

  // Generate signed URL (valid for 1 hour)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('band-files')
    .createSignedUrl(file.file_path, 3600)

  if (urlError) throw urlError
  return urlData.signedUrl
}

export async function deleteFile(fileId: string) {
  const supabase = await createClient()

  // Get file path first
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('file_path')
    .eq('id', fileId)
    .single()

  if (fetchError) throw fetchError

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('band-files')
    .remove([file.file_path])

  if (storageError) throw storageError

  // Delete database record
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)

  if (error) throw error
}

export async function updateFileMetadata(fileId: string, updates: { name?: string; description?: string }) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('files')
    .update({
      name: updates.name,
      description: updates.description
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

**Test:**
- `uploadFile()` → file uploaded to storage, record created
- `getBandFiles()` → returns all files with uploader info
- `getFileDownloadUrl()` → returns signed URL that works
- `deleteFile()` → removes from storage and database
- `updateFileMetadata()` → updates name/description

---

## Checkpoint 4: Events, Availability & Files Backend Complete

```
✓ Events:
  ✓ createEvent() creates event with all fields
  ✓ updateEvent() updates event
  ✓ deleteEvent() removes event and RSVPs (cascade)
  ✓ getBandEvents() returns events with RSVP counts
  ✓ getEvent() returns single event with all RSVPs
  ✓ getUpcomingEvents() filters future events

✓ RSVPs:
  ✓ setRsvp() creates or updates RSVP (upsert)
  ✓ getEventRsvps() returns RSVPs with profiles
  ✓ getUserRsvp() returns current user's RSVP
  ✓ RLS: only band members can access events

✓ Availability Polling (New):
  ✓ createAvailabilityPoll() creates poll with options
  ✓ getBandPolls() returns polls with response counts
  ✓ getPoll() returns poll with all responses
  ✓ submitAvailability() creates/updates response
  ✓ getBestTimeSlot() calculates optimal time

✓ File Storage (New):
  ✓ uploadFile() uploads to storage + creates record
  ✓ getBandFiles() returns files with metadata
  ✓ getFileDownloadUrl() returns signed URL
  ✓ deleteFile() removes from storage and database
```

**Test Full Flow:**

*Events:*
1. Create event for band
2. User A RSVPs "going"
3. User B RSVPs "maybe"
4. Get event → shows both RSVPs
5. User A changes to "not_going"
6. Get event → shows updated status
7. Delete event → RSVPs also deleted

*Availability:*
1. Create poll with 5 time options
2. User A marks slots 1, 2, 3 as available
3. User B marks slots 2, 3, 4 as available
4. Get best time → should return slot 2 or 3
5. Convert to event

*Files:*
1. Upload test file
2. Get download URL
3. Verify download works
4. Delete file
5. Verify storage empty

**Use:** `/verification-before-completion` skill

**Commit:** "Implement events, availability polling, and file storage backend"

**Next Stage:** [STAGE-5-COMMUNICATION.md](./STAGE-5-COMMUNICATION.md)
