# Stage 5: Communication Backend

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are building **BandHub**. Events work (Stage 4). Now you build announcements, threads, messages, and real-time subscriptions.

**Prerequisites:** Stage 4 complete.

**Research References:**
- [Communication Patterns](C:\Users\jpcoo\docs\research\communication-patterns.md) - Slack/Discord thread patterns, notification strategies
- [GitHub Resources](C:\Users\jpcoo\docs\research\github-resources.md) - Supabase Realtime implementation examples

---

## Your Goal

Create server actions for:
1. Announcements
2. Threads
3. Messages
4. Real-time subscriptions

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `supabase` MCP | Database + Realtime setup |
| `context7` MCP | Supabase Realtime docs |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Write server actions + hooks |
| `quality-assurance` | Review code |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/review` | Code review |
| `/security` | Review realtime security |

---

## Task 5.1: Announcements Server Actions

**Create:** `actions/announcements.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createAnnouncement(bandId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      band_id: bandId,
      title,
      content,
      created_by: user.id
    })
    .select(`
      *,
      profiles!created_by(display_name, avatar_url)
    `)
    .single()

  if (error) throw error
  return data
}

export async function getBandAnnouncements(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles!created_by(display_name, avatar_url)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (error) throw error
}
```

**Test:**
- `createAnnouncement()` → creates announcement (admin only via RLS)
- `getBandAnnouncements()` → returns announcements newest first
- `deleteAnnouncement()` → removes announcement

---

## Task 5.2: Threads Server Actions

**Create:** `actions/threads.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createThread(bandId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('threads')
    .insert({
      band_id: bandId,
      title,
      created_by: user.id
    })
    .select(`
      *,
      profiles!created_by(display_name, avatar_url)
    `)
    .single()

  if (error) throw error
  return data
}

export async function getBandThreads(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('threads')
    .select(`
      *,
      profiles!created_by(display_name),
      messages(count)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getThread(threadId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('threads')
    .select(`
      *,
      profiles!created_by(display_name, avatar_url)
    `)
    .eq('id', threadId)
    .single()

  if (error) throw error
  return data
}

export async function deleteThread(threadId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('threads')
    .delete()
    .eq('id', threadId)

  if (error) throw error
}
```

**Test:**
- `createThread()` → creates thread
- `getBandThreads()` → returns threads with message counts
- `getThread()` → returns single thread
- `deleteThread()` → removes thread and all messages (cascade)

---

## Task 5.3: Messages Server Actions

**Create:** `actions/messages.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function sendMessage(bandId: string, content: string, threadId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      band_id: bandId,
      thread_id: threadId || null,
      user_id: user.id,
      content
    })
    .select(`
      *,
      profiles!user_id(display_name, avatar_url)
    `)
    .single()

  if (error) throw error
  return data
}

export async function getMessages(bandId: string, threadId?: string, limit = 50) {
  const supabase = await createClient()

  let query = supabase
    .from('messages')
    .select(`
      *,
      profiles!user_id(display_name, avatar_url)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (threadId) {
    query = query.eq('thread_id', threadId)
  } else {
    query = query.is('thread_id', null)  // Main chat = no thread
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error
}
```

**Test:**
- `sendMessage(bandId, 'Hello')` → creates main chat message
- `sendMessage(bandId, 'Hello', threadId)` → creates thread message
- `getMessages(bandId)` → returns main chat messages
- `getMessages(bandId, threadId)` → returns thread messages

---

## Task 5.4: Real-time Subscriptions

**Create:** `hooks/use-realtime-messages.ts`

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: { display_name: string; avatar_url: string }
}

export function useRealtimeMessages(bandId: string, threadId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      let query = supabase
        .from('messages')
        .select('*, profiles!user_id(display_name, avatar_url)')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true })

      if (threadId) {
        query = query.eq('thread_id', threadId)
      } else {
        query = query.is('thread_id', null)
      }

      const { data } = await query
      if (data) setMessages(data)
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${bandId}:${threadId || 'main'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: threadId
            ? `band_id=eq.${bandId},thread_id=eq.${threadId}`
            : `band_id=eq.${bandId},thread_id=is.null`
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from('messages')
            .select('*, profiles!user_id(display_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bandId, threadId])

  return messages
}
```

**Test Real-time:**
1. Open two browser windows, same band chat
2. Send message in Window A
3. Message appears instantly in Window B
4. No page refresh needed

---

## Task 5.5: Enable Realtime in Supabase

**Use:** `supabase` MCP or Supabase Dashboard

Enable realtime on the `messages` table:
1. Go to Database → Replication
2. Enable replication for `messages` table
3. Or run SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

---

## Checkpoint 5: Communication Backend Complete

```
✓ createAnnouncement() works (admin only)
✓ getBandAnnouncements() returns announcements
✓ deleteAnnouncement() removes announcement
✓ createThread() creates thread
✓ getBandThreads() returns threads with message counts
✓ sendMessage() sends to main chat or thread
✓ getMessages() returns messages for chat/thread
✓ useRealtimeMessages() hook works
✓ Real-time: message appears in other windows instantly
✓ Subscription cleans up on unmount
```

**Real-time Test (Critical):**
1. Open two incognito windows
2. Log in as two different band members
3. Both go to band chat
4. User A sends message
5. Message appears in User B's window < 1 second
6. Close one window
7. Verify no subscription errors in console

**Use:** `playwright` MCP to automate real-time test
**Use:** `/security` skill to review subscription security

**Commit:** "Implement communication with real-time messaging"

**Next Stage:** [STAGE-6-TESTS.md](./STAGE-6-TESTS.md)
