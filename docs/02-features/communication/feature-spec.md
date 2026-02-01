# Communication Feature Specification

## Overview

Communication features enable band members to stay connected through real-time chat, discussion threads, and admin announcements. Real-time messaging is powered by Supabase Realtime.

## Components

1. **Group Chat** - Real-time messaging for the whole band
2. **Discussion Threads** - Topic-based conversations
3. **Announcements** - Admin-only posts for important updates

---

## Group Chat

### User Stories

#### US-CHAT-1: Send Message
**As a** band member
**I want to** send messages to my band
**So that** I can communicate quickly

**Acceptance Criteria:**
- Text input at bottom of chat
- Messages appear instantly
- Shows sender name and timestamp

#### US-CHAT-2: Real-time Updates
**As a** band member
**I want to** see new messages without refreshing
**So that** conversation flows naturally

**Acceptance Criteria:**
- New messages appear in < 1 second
- No page refresh needed
- Works across multiple tabs/windows

### UI Components

#### Chat Page (`/band/[id]/chat`)
- Message list (scrollable)
- Message bubbles with sender avatar
- Timestamp on messages
- Input bar fixed at bottom
- Send button

---

## Discussion Threads

### User Stories

#### US-THREAD-1: Create Thread
**As a** band member
**I want to** create discussion threads
**So that** conversations can be organized by topic

**Acceptance Criteria:**
- Form with thread title
- Thread appears in list
- Can navigate to thread

#### US-THREAD-2: Reply to Thread
**As a** band member
**I want to** reply to threads
**So that** I can participate in discussions

**Acceptance Criteria:**
- Reply input in thread view
- Replies appear in real-time
- Reply count updates

### UI Components

#### Threads List (`/band/[id]/threads`)
- Thread cards with title
- Message count badge
- Creator name
- "Create Thread" button

#### Thread Detail (`/band/[id]/threads/[threadId]`)
- Thread title header
- Message list (same as chat)
- Reply input at bottom

---

## Announcements

### User Stories

#### US-ANN-1: Create Announcement
**As a** band admin
**I want to** post announcements
**So that** I can share important updates

**Acceptance Criteria:**
- Form with title and content
- Only visible to admins
- Appears at top of announcements list

#### US-ANN-2: View Announcements
**As a** band member
**I want to** read announcements
**So that** I stay informed

**Acceptance Criteria:**
- List of announcements (newest first)
- Shows title, content, author, date
- Non-admins see list only (no create form)

### UI Components

#### Announcements Page (`/band/[id]/announcements`)
- Create form (admin only): title, content
- Announcement cards with:
  - Title
  - Content
  - Author avatar and name
  - Date
  - Delete button (admin only)

---

## Data Model

### messages table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| thread_id | UUID | References threads (null for main chat) |
| user_id | UUID | References profiles |
| content | TEXT | Message content (required) |
| created_at | TIMESTAMPTZ | Sent timestamp |

### threads table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| title | TEXT | Thread title (required) |
| created_by | UUID | References profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |

### announcements table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| title | TEXT | Announcement title |
| content | TEXT | Announcement content (required) |
| created_by | UUID | References profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Security

### RLS Policies

**messages:**
- Band members can view messages
- Band members can send messages

**threads:**
- Band members can view threads
- Band members can create threads

**announcements:**
- Band members can view announcements
- **Admins only** can create announcements

## Real-time Implementation

### Supabase Realtime Setup
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Client Hook
```typescript
const channel = supabase
  .channel(`messages:${bandId}:${threadId || 'main'}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `band_id=eq.${bandId}`
  }, handleNewMessage)
  .subscribe()
```

### Cleanup
```typescript
useEffect(() => {
  // ... subscribe
  return () => supabase.removeChannel(channel)
}, [bandId])
```

---

*Implementation: [plans/STAGE-5-COMMUNICATION.md](../../../plans/STAGE-5-COMMUNICATION.md)*
