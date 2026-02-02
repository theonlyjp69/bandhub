# Communication Patterns Research

## Executive Summary

Modern team communication tools use these patterns:
- **Channels** for organized topic-based discussion
- **Threads** for focused sub-conversations
- **Real-time messaging** with presence indicators
- **Notifications** with granular controls
- **@mentions** for targeted attention

For BandHub: Implement simple group chat + discussion threads (announcements). Skip complex channel structures.

---

## Tool Deep Dives

### Slack

**Website**: [slack.com](https://slack.com/)

Slack pioneered modern team communication patterns.

#### Thread Design Journey

Slack's thread implementation was a major design challenge:

**Key Design Decision**: "Hiding replies from the channel content turned out to be the single most meaningful change we made while designing Threads."

**Thread Architecture**:
- Single level of replies only (no nested threads)
- Threads appear in side panel, not inline
- "All Threads" view for catching up
- Thread notifications in Activity panel

#### Thread Benefits

| Benefit | Description |
|---------|-------------|
| Context preservation | Keeps related messages together |
| Reduced noise | Only participants get notified |
| Clear announcements | Main channel stays uncluttered |
| Focused discussion | Topic-specific without derailing |

#### Notification Patterns

**Default notifications for**:
- Direct messages
- @mentions
- Channel notifications (@here, @channel)
- Custom keywords
- Thread replies you're following

**Thread-specific rules**:
- Notified if you started the thread
- Notified if you replied to the thread
- Notified if you were mentioned
- Option to broadcast reply to channel

#### Channel-Level Controls

- Mute entire channels
- Different notification settings per channel
- Thread replies don't light up channel name
- "Also send to channel" checkbox for important replies

#### Best Practices

Use threads when:
- Channel has many members
- Response only relevant to few people
- Extended discussion expected
- Keeping announcements clean

**Takeaway for BandHub**: Implement simple threads for announcements. One level of replies is sufficient.

---

### Discord

**Website**: [discord.com](https://discord.com/)

Discord handles community-scale communication.

#### Channel vs Thread Comparison

| Aspect | Channels | Threads |
|--------|----------|---------|
| Purpose | Permanent topic spaces | Temporary sub-discussions |
| Visibility | Always visible | Can be archived |
| Limit | 500 per server | 1,000 active + unlimited archived |
| Sorting | Can organize in categories | Cannot sort by urgency |
| Longevity | Permanent | Auto-archive after inactivity |

#### Thread Behavior

**Auto-Archive Settings**:
- 1 hour (Nitro only)
- 24 hours (default)
- 3 days
- 7 days (Nitro only)

**UI Patterns**:
- Split-view panel when opening from channel
- Full-screen when opening from thread list
- Active threads appear in channel list
- Archived threads less visible

#### Design Considerations

**Problem Solved**: "For most of Discord's lifespan, the difficulty of managing relevant but fragmented conversations has been a concern for community builders."

**Solution**: Threads for topics that:
- Don't warrant their own channel
- Would disrupt main conversation
- Are temporary in nature

**Community Feedback**: Users want ability to convert threads to channels when discussions expand permanently.

**Takeaway for BandHub**: Threads should be simple and auto-archive. Don't over-engineer.

---

### Microsoft Teams

**Website**: [teams.microsoft.com](https://teams.microsoft.com/)

Teams focuses on enterprise collaboration.

#### Chat Types

| Type | Use Case |
|------|----------|
| 1:1 DM | Private conversations |
| Group chat | Small team projects |
| Channel post | Team-wide discussions |
| File conversation | Comments on shared docs |

#### New Chat Experience (2024/2025)

Microsoft redesigned chat and channels:
- **Unified view**: Chats, teams, and channels in one place
- **Threads layout**: Channel conversations look like group chats
- **Immediate back-and-forth**: Encourages real-time discussion

#### Real-Time Features

- Instant messaging with no email delays
- Threaded conversations with @mentions
- File sharing with in-chat editing
- Real-time co-authoring on Office docs
- Version control built-in

#### Integration Patterns

- Files stored in OneDrive (DMs) or SharePoint (channels)
- Accessible directly in chat interface
- Meeting coordination in chat context

**Takeaway for BandHub**: Keep file sharing simple, real-time messaging is expected.

---

## Communication Patterns for BandHub

### Recommended: Three Communication Types

#### 1. Announcements (Admin Posts)

**Pattern**: One-way broadcast with reactions/comments

```
┌─────────────────────────────────────────┐
│ [Admin Avatar] Admin Name    [Timestamp]│
│                                         │
│ Announcement title                      │
│ Announcement content...                 │
│                                         │
│ [Like] [Comment] 5 reactions            │
├─────────────────────────────────────────┤
│ Comments (collapsed by default)         │
│                                         │
│ > Member: Comment text...               │
│ > Member: Comment text...               │
└─────────────────────────────────────────┘
```

**Features**:
- Only admins can post
- All members can react and comment
- Comments are threaded (one level)
- Pinnable for important announcements

#### 2. Group Chat (Real-Time)

**Pattern**: Simple message stream

```
┌─────────────────────────────────────────┐
│ Today                                   │
│                                         │
│ [Avatar] Member  12:34 PM               │
│ Message content...                      │
│                                         │
│ [Avatar] Member  12:35 PM               │
│ Reply message...                        │
│                                         │
├─────────────────────────────────────────┤
│ [Type a message...            ] [Send]  │
└─────────────────────────────────────────┘
```

**Features**:
- Real-time via Supabase Realtime
- No threads (keep it simple for MVP)
- @mentions for attention
- Emoji reactions
- Unread indicator

#### 3. Discussion Threads (Async Topics)

**Pattern**: Topic-based conversations

```
┌─────────────────────────────────────────┐
│ Thread Title                            │
│ Started by Member · 5 replies · 2h ago  │
│                                         │
│ Original post content...                │
│                                         │
├─────────────────────────────────────────┤
│ Replies                                 │
│                                         │
│ [Avatar] Member  1h ago                 │
│ Reply content...                        │
│                                         │
│ [Avatar] Member  30m ago                │
│ Reply content...                        │
│                                         │
├─────────────────────────────────────────┤
│ [Write a reply...             ] [Post]  │
└─────────────────────────────────────────┘
```

**Features**:
- Anyone can start a thread
- Topic title for context
- Flat replies (no nesting)
- Unread indicators
- Can close/archive threads

---

## Notification Strategy

### Notification Types

| Event | Notify | Method |
|-------|--------|--------|
| New announcement | All members | In-app + optional email |
| @mentioned | Mentioned user | In-app + optional push |
| Thread reply (if following) | Followers | In-app only |
| New chat message | All online | In-app badge |
| Event RSVP reminder | Invited members | In-app + email |

### Unread Indicators

```
Sidebar:
├── Chat  (3)        ← Unread count
├── Announcements •  ← Dot for new
├── Threads (1)      ← Unread count
└── Events           ← No indicator
```

### User Controls

- Mute all notifications
- Email digest frequency (immediately, daily, never)
- Push notification preferences
- Quiet hours

---

## Real-Time Implementation

### Supabase Realtime Approach

```typescript
// Subscribe to new messages
supabase
  .channel('chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `band_id=eq.${bandId}`
  }, (payload) => {
    // Add message to UI
  })
  .subscribe()
```

### Presence Indicators

```typescript
// Track online members
supabase
  .channel('presence')
  .on('presence', { event: 'sync' }, () => {
    // Update online status
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id, online_at: new Date() })
    }
  })
```

### Features to Implement

1. **Online status** - Green dot for active users
2. **Typing indicator** - "Member is typing..."
3. **Read receipts** - Optional, for DMs only
4. **Message delivery** - Optimistic UI with reconciliation

---

## Message Formatting

### Supported Formats

| Format | Syntax | Render |
|--------|--------|--------|
| Bold | `**text**` | **text** |
| Italic | `*text*` | *text* |
| Link | `[text](url)` | [text](url) |
| @mention | `@username` | @username |
| Emoji | `:emoji:` | Emoji picker |

### Keep It Simple

For MVP, avoid:
- Code blocks
- Tables
- Images inline
- Rich embeds

Just text, links, @mentions, and emoji.

---

## Data Model Suggestions

### Messages Table

```sql
messages (
  id uuid PRIMARY KEY,
  band_id uuid REFERENCES bands,
  user_id uuid REFERENCES users,
  content text NOT NULL,
  type text DEFAULT 'chat', -- 'chat', 'announcement'
  created_at timestamptz,
  updated_at timestamptz
)
```

### Threads Table

```sql
threads (
  id uuid PRIMARY KEY,
  band_id uuid REFERENCES bands,
  user_id uuid REFERENCES users,
  title text NOT NULL,
  content text,
  is_closed boolean DEFAULT false,
  reply_count integer DEFAULT 0,
  last_reply_at timestamptz,
  created_at timestamptz
)
```

### Thread Replies Table

```sql
thread_replies (
  id uuid PRIMARY KEY,
  thread_id uuid REFERENCES threads,
  user_id uuid REFERENCES users,
  content text NOT NULL,
  created_at timestamptz
)
```

### Message Reactions Table

```sql
reactions (
  id uuid PRIMARY KEY,
  message_id uuid, -- nullable
  thread_id uuid,  -- nullable
  user_id uuid REFERENCES users,
  emoji text NOT NULL,
  created_at timestamptz
)
```

---

## MVP Scope

### Include

- [x] Group chat with real-time messages
- [x] @mentions
- [x] Emoji reactions
- [x] Announcements (admin only)
- [x] Comments on announcements
- [x] Discussion threads with replies
- [x] Unread indicators
- [x] Basic formatting (bold, italic, links)

### Defer to Post-MVP

- [ ] Direct messages (1:1)
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message editing
- [ ] Message deletion
- [ ] File attachments
- [ ] Rich link previews
- [ ] Push notifications
- [ ] Email notifications

---

## Sources

- [Slack Threads Design Journey](https://slack.design/articles/threads-in-slack-a-long-design-journey-part-2-of-2/)
- [Slack Threads Usage Tips](https://slack.com/resources/using-slack/tips-on-how-best-to-use-threaded-messages)
- [Slack Notification Guide](https://slack.com/help/articles/360025446073-Guide-to-Slack-notifications)
- [Slack Enterprise UX Best Practices](https://www.smashingmagazine.com/2017/08/best-practices-enterprise-messaging-ux-slack/)
- [Discord Threads FAQ](https://support.discord.com/hc/en-us/articles/4403205878423-Threads-FAQ)
- [Discord Channels vs Threads](https://www.metacrm.inc/blog/discord-support-done-right-channels-vs-threads)
- [Teams New Chat Experience](https://www.microsoft.com/en-us/microsoft-365/blog/2024/10/28/streamline-collaboration-with-the-new-chat-and-channels-experience-in-microsoft-teams/)
- [Teams Chat Guide](https://blog.virtosoftware.com/teams-chat/)
