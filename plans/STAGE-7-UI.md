# Stage 7: Functional UI (No Styling)

## Context

You are building **BandHub**. Backend is complete and tested (Stage 6). Now you build the UI to make the app usable. **Focus on function, not form.** Make it work, don't make it pretty yet.

**Prerequisites:** Stage 6 complete, all tests passing.

**Research References:**
- [Task Management Patterns](C:\Users\jpcoo\docs\research\task-management-patterns.md) - View patterns (list, board, etc.)
- [Event Management Patterns](C:\Users\jpcoo\docs\research\event-management-patterns.md) - Calendar and RSVP UI patterns
- [Communication Patterns](C:\Users\jpcoo\docs\research\communication-patterns.md) - Chat and thread UI patterns

---

## Your Goal

Build minimal, functional UI for all features. Use basic HTML elements. No fancy styling. Just make it work.

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `context7` MCP | Next.js App Router docs |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Build UI components |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/review` | Code review |
| `/verification-before-completion` | Test UI works |

---

## Task 7.1: Auth UI

**Create:** `app/login/page.tsx`

Simple login page:
- "Sign in with Google" button
- Calls `signInWithOAuth`

**Create:** `app/(app)/layout.tsx`

Protected layout:
- Shows current user
- Sign out button
- Navigation links

**Test:**
- Visit /dashboard → redirects to /login
- Click sign in → Google OAuth
- After login → lands on dashboard
- Click sign out → back to login

---

## Task 7.2: Dashboard UI

**Create:** `app/(app)/dashboard/page.tsx`

Shows:
- List of user's bands (from `getUserBands()`)
- "Create New Band" link
- "Pending Invitations" link with count

```tsx
export default async function DashboardPage() {
  const bands = await getUserBands()
  const invitations = await getUserInvitations()

  return (
    <div>
      <h1>My Bands</h1>
      <a href="/create-band">Create New Band</a>

      {invitations.length > 0 && (
        <a href="/invitations">
          Pending Invitations ({invitations.length})
        </a>
      )}

      <ul>
        {bands.map(band => (
          <li key={band.id}>
            <a href={`/band/${band.id}`}>{band.name}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Test:** Bands appear, links work

---

## Task 7.3: Create Band UI

**Create:** `app/(app)/create-band/page.tsx`

Form with:
- Name input (required)
- Description textarea (optional)
- Submit button

On submit:
- Call `createBand()`
- Redirect to `/band/[id]`

**Test:** Create band → appears in dashboard

---

## Task 7.4: Invitations UI

**Create:** `app/(app)/invitations/page.tsx`

Shows pending invitations with:
- Band name
- Invited by
- Accept button
- Decline button

**Test:** Accept → added to band, appears in dashboard

---

## Task 7.5: Band Home UI

**Create:** `app/(app)/band/[id]/page.tsx`

Shows:
- Band name
- Navigation: Calendar, Chat, Threads, Announcements, Members, Files, Availability
- Upcoming events widget (next 3 events)
- Recent announcements (last 2)

**Test:** Navigate between sections

---

## Task 7.6: Members UI

**Create:** `app/(app)/band/[id]/members/page.tsx`

Shows:
- List of members with name, role
- Invite form (admin only): email input + invite button
- Remove button for each member (admin only)

**Test:**
- See all members
- Admin can invite
- Non-admin cannot see invite form

---

## Task 7.7: Events UI

**Create:** `app/(app)/band/[id]/calendar/page.tsx`

Shows:
- List of all events (simple list, not calendar view yet)
- "Create Event" link

**Create:** `app/(app)/band/[id]/events/new/page.tsx`

Form with:
- Title
- Event type dropdown (show, rehearsal, deadline, other)
- Start date/time
- End date/time (optional)
- Location
- Description
- Type-specific fields (venue, pay for shows)

**Create:** `app/(app)/band/[id]/events/[eventId]/page.tsx`

Shows:
- Event details
- RSVP buttons (Going, Maybe, Can't Make It)
- List of RSVPs

**Test:**
- Create event → appears in list
- Click event → see details
- RSVP → status changes, appears in list

---

## Task 7.8: Announcements UI

**Create:** `app/(app)/band/[id]/announcements/page.tsx`

Shows:
- List of announcements (newest first)
- Create form (admin only): title, content, submit

**Test:**
- Admin creates announcement → appears in list
- Non-admin sees announcements but no form

---

## Task 7.9: Chat UI

**Create:** `app/(app)/band/[id]/chat/page.tsx`

Shows:
- List of messages (using `useRealtimeMessages` hook)
- Message input at bottom
- Send button

**Real-time test:**
- Open two browser windows
- Send message in one
- Appears instantly in other

```tsx
'use client'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { sendMessage } from '@/actions/messages'

export default function ChatPage({ params }) {
  const messages = useRealtimeMessages(params.id)
  const [input, setInput] = useState('')

  const handleSend = async () => {
    await sendMessage(params.id, input)
    setInput('')
  }

  return (
    <div>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.profiles.display_name}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  )
}
```

---

## Task 7.10: Threads UI

**Create:** `app/(app)/band/[id]/threads/page.tsx`

Shows:
- List of threads with title, message count
- "Create Thread" form

**Create:** `app/(app)/band/[id]/threads/[threadId]/page.tsx`

Shows:
- Thread title
- Messages (using `useRealtimeMessages` with threadId)
- Reply input

**Test:** Create thread, post replies, real-time works

---

## Task 7.11: Availability Polling UI *(New - from research)*

See [Event Management Patterns](C:\Users\jpcoo\docs\research\event-management-patterns.md) for When2Meet-style UI patterns.

**Create:** `app/(app)/band/[id]/availability/page.tsx`

Shows:
- List of availability polls
- "Create Poll" link
- For each poll: title, response count, status (open/closed)

**Create:** `app/(app)/band/[id]/availability/new/page.tsx`

Form with:
- Poll title
- Description (optional)
- Date options builder:
  - Add multiple date/time slots
  - For each slot: date picker, start time, end time
- Closes at (optional)
- Submit button

**Create:** `app/(app)/band/[id]/availability/[pollId]/page.tsx`

Shows:
- Poll title and description
- Grid of time slots (When2Meet style):
  - Columns = date options
  - Rows = members
  - Cells = checkboxes for availability
- Visual indicator of overlap (darker = more available)
- "Best time" summary showing slot with most responses
- "Create Event from Best Time" button
- User's own response (checkboxes)

```tsx
'use client'
import { useState } from 'react'
import { submitAvailability } from '@/actions/availability'

export default function PollPage({ poll, userResponse }) {
  const [selected, setSelected] = useState<number[]>(
    userResponse?.available_slots || []
  )

  const toggleSlot = (index: number) => {
    setSelected(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleSubmit = async () => {
    await submitAvailability(poll.id, selected)
  }

  return (
    <div>
      <h1>{poll.title}</h1>
      <p>{poll.description}</p>

      <h2>Select your availability:</h2>
      <div>
        {poll.date_options.map((option, index) => (
          <label key={index}>
            <input
              type="checkbox"
              checked={selected.includes(index)}
              onChange={() => toggleSlot(index)}
            />
            {option.date} {option.start_time}-{option.end_time}
          </label>
        ))}
      </div>

      <button onClick={handleSubmit}>Save Availability</button>

      <h2>All Responses:</h2>
      {/* Grid showing all members' responses */}
    </div>
  )
}
```

**Test:**
- Create poll with 5 time options
- Submit availability as User A
- Submit availability as User B
- See overlap visualization
- Create event from best time

---

## Task 7.12: Files UI *(New - from research)*

**Create:** `app/(app)/band/[id]/files/page.tsx`

Shows:
- List of files with name, size, uploader, date
- Upload form: file input, name, description
- Download button for each file
- Delete button (for uploader only)

```tsx
'use client'
import { useState } from 'react'
import { uploadFile, deleteFile, getFileDownloadUrl } from '@/actions/files'

export default function FilesPage({ files, bandId }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    await uploadFile({ bandId, file, name, description })
    setUploading(false)
    // Refresh page or update state
  }

  const handleDownload = async (fileId: string) => {
    const url = await getFileDownloadUrl(fileId)
    window.open(url, '_blank')
  }

  return (
    <div>
      <h1>Files</h1>

      <form onSubmit={handleUpload}>
        <input type="file" name="file" required />
        <input type="text" name="name" placeholder="Display name" required />
        <textarea name="description" placeholder="Description" />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <ul>
        {files.map(file => (
          <li key={file.id}>
            <span>{file.name}</span>
            <span>{(file.file_size / 1024).toFixed(1)} KB</span>
            <span>by {file.profiles.display_name}</span>
            <button onClick={() => handleDownload(file.id)}>Download</button>
            {/* Show delete only for uploader */}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Test:**
- Upload file → appears in list
- Download file → opens/downloads correctly
- Delete file (as uploader) → removed from list
- Non-uploader cannot delete

---

## Checkpoint 7: Functional App Complete

```
✓ Login/logout works
✓ Dashboard shows user's bands
✓ Can create new band
✓ Can invite members via email
✓ Can accept/decline invitations
✓ Band navigation works
✓ Can see and manage members
✓ Can create events (all types)
✓ Can RSVP to events
✓ Can see event RSVPs
✓ Can create announcements (admin)
✓ Can see announcements
✓ Chat works with real-time
✓ Threads work with real-time
✓ Availability polling works (New):
  ✓ Can create polls with time options
  ✓ Can submit availability
  ✓ Can see all responses
  ✓ Can identify best time
✓ File storage works (New):
  ✓ Can upload files
  ✓ Can download files
  ✓ Can delete own files
✓ All user flows work end-to-end
```

**Full User Journey Test:**
1. User A signs in
2. User A creates band "The Rockers"
3. User A invites user.b@email.com
4. User B signs in, sees invitation, accepts
5. User A creates show event
6. Both users RSVP
7. Both users chat (real-time verified)
8. User A posts announcement
9. User B creates thread, User A replies
10. User A creates availability poll
11. Both users submit availability
12. User A uploads a setlist file
13. User B downloads the file

**Use:** `playwright` MCP to automate this test
**Use:** `/verification-before-completion` skill

**Commit:** "Implement functional UI for all features"

**Next Stage:** [STAGE-8-POLISH.md](./STAGE-8-POLISH.md)
