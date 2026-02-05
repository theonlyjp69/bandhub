# Notifications Feature Specification

## Overview

The notification system keeps band members informed about events, deadlines, and updates through three delivery channels: in-app notifications (bell icon + panel), browser push notifications, and toast alerts. Users control what they receive via a preferences dialog.

## Components

1. **In-App Notifications** - Bell icon in navbar with dropdown panel
2. **Push Notifications** - Browser-level notifications via service worker
3. **Toast Alerts** - Transient Sonner toasts for realtime events
4. **Preferences** - Per-user control over notification types

---

## In-App Notifications

### User Stories

#### US-NOTIF-1: View Notifications
**As a** band member
**I want to** see my notifications in a dropdown panel
**So that** I can stay informed about band activity

**Acceptance Criteria:**
- Bell icon in navbar shows unread count badge
- Badge pulses when unread count > 0
- Clicking bell opens notification panel
- Panel shows notifications sorted by newest first
- Each notification shows icon, title, body, and relative time
- Unread notifications have highlighted background

#### US-NOTIF-2: Mark as Read
**As a** band member
**I want to** mark notifications as read
**So that** I can track what I've already seen

**Acceptance Criteria:**
- Click notification to mark as read and navigate to link
- "Mark all read" button in panel header
- Unread count updates immediately (optimistic)

#### US-NOTIF-3: Delete Notifications
**As a** band member
**I want to** delete notifications I no longer need
**So that** my notification list stays clean

**Acceptance Criteria:**
- Delete button appears on hover (desktop) or always visible (mobile)
- Deletion is immediate with optimistic update

#### US-NOTIF-4: Real-time Updates
**As a** band member
**I want to** see new notifications without refreshing
**So that** I'm always up to date

**Acceptance Criteria:**
- New notifications appear instantly via Supabase realtime
- Toast alert shown for each new notification
- Unread count updates in real-time

### UI Components

#### NotificationBell (`components/notification-bell.tsx`)
- Ghost button with Bell icon (lucide-react)
- Unread count badge with `badge-pulse` animation
- Badge capped at 99+
- Popover trigger for NotificationPanel

#### NotificationPanel (`components/notification-panel.tsx`)
- Header: "Notifications" + "Mark all read" + settings gear
- ScrollArea with max-h-[400px]
- Notification items with type-based icons
- Skeleton loading state (3 rows)
- Empty state: "No notifications - You're all caught up!"
- "Load more" pagination button
- Keyboard accessible (role="button", tabIndex, Enter/Space)
- Touch-friendly actions (always visible on mobile, hover-reveal on desktop)

#### Notification Type Icons
| Type | Icon | Description |
|------|------|-------------|
| event_created | CalendarPlus | New event in band |
| event_updated | CalendarClock | Event modified |
| event_cancelled | CalendarX | Event cancelled |
| rsvp_reminder | Clock | RSVP deadline approaching |
| poll_reminder | BarChart | Poll deadline approaching |
| default | Bell | Other notifications |

---

## Push Notifications

### User Stories

#### US-PUSH-1: Enable Push
**As a** band member
**I want to** receive browser push notifications
**So that** I'm alerted even when the app isn't open

**Acceptance Criteria:**
- Toggle in notification preferences dialog
- Browser permission prompt on first enable
- Service worker registered automatically
- Push subscription saved to database
- Disabled by default

#### US-PUSH-2: Receive Push
**As a** band member
**I want to** see native browser notifications
**So that** I don't miss important updates

**Acceptance Criteria:**
- Shows notification title and body
- App icon displayed
- Clicking notification navigates to relevant page

### Technical Implementation

#### Service Worker (`public/sw.js`)
- Handles `push` event: displays browser notification
- Handles `notificationclick` event: focuses app window and navigates

#### useServiceWorker Hook (`hooks/use-service-worker.ts`)
- Registers service worker on mount
- `registerPush()`: Request permission, get VAPID key, subscribe, save
- `unregisterPush()`: Unsubscribe and remove from server
- `isSupported`: Boolean for browser capability check

---

## Notification Preferences

### User Stories

#### US-PREFS-1: Manage Preferences
**As a** band member
**I want to** control which notifications I receive
**So that** I'm not overwhelmed

**Acceptance Criteria:**
- Dialog accessible from gear icon in notification panel
- Toggle switches for each notification type
- Changes saved immediately with optimistic updates
- Push toggle includes permission status display

### UI Component

#### NotificationPreferences (`components/notification-preferences.tsx`)
- Dialog triggered by Settings gear icon
- Toggle switches:
  - New Events (eventCreated)
  - Event Updates (eventUpdated)
  - RSVP Reminders (rsvpReminder)
  - Poll Reminders (pollReminder)
  - Push Notifications (pushEnabled) - separated by divider
- Shows browser permission status when push is enabled
- Disabled push toggle when browser doesn't support it
- Loading skeleton while preferences load

---

## Data Flow

### Notification Creation
```
User Action (e.g., create event)
  -> Server Action calls notifyBandMembers()
  -> Fetches band members
  -> Filters by event visibility (private/band)
  -> Checks each user's notification_preferences
  -> Batch inserts into notifications table
  -> (Optional) sendPushNotification() for push-enabled users
```

### Notification Delivery
```
INSERT into notifications table
  -> Supabase Realtime broadcasts to channel
  -> useNotifications hook receives INSERT event
  -> Prepends to local notification list
  -> Increments unread count
  -> Shows Sonner toast alert
```

### Cron Reminders
```
Vercel cron (every 6 hours) -> /api/cron/reminders
  -> Finds RSVP/poll deadlines within 24 hours
  -> Creates notifications for non-responders
  -> Respects user preferences
```

---

## Database Schema

### notifications
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to profiles |
| type | TEXT | Notification type identifier |
| title | TEXT | Display title |
| body | TEXT? | Detailed message |
| link | TEXT? | Navigation URL |
| data | JSONB? | Extra metadata |
| read_at | TIMESTAMPTZ? | null = unread |
| created_at | TIMESTAMPTZ | Default NOW() |

### push_subscriptions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to profiles |
| endpoint | TEXT | Web Push API endpoint (UNIQUE) |
| keys | JSONB | p256dh and auth keys |
| created_at | TIMESTAMPTZ | Default NOW() |

### notification_preferences
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| user_id | UUID | PK | FK to profiles |
| event_created | BOOLEAN | true | New event notifications |
| event_updated | BOOLEAN | true | Event update notifications |
| rsvp_reminder | BOOLEAN | true | RSVP deadline reminders |
| poll_reminder | BOOLEAN | true | Poll deadline reminders |
| push_enabled | BOOLEAN | false | Browser push notifications |

---

## Server Actions

| File | Function | Description |
|------|----------|-------------|
| notifications.ts | getUserNotifications(limit, offset) | Paginated fetch |
| notifications.ts | markAsRead(id) | Mark single read |
| notifications.ts | markAllAsRead() | Mark all read |
| notifications.ts | getUnreadCount() | Count unread |
| notifications.ts | deleteNotification(id) | Delete single |
| notifications.ts | createNotification(input) | Create (service role) |
| notifications.ts | notifyBandMembers(bandId, type, data) | Batch notify |
| push.ts | getVapidPublicKey() | Get VAPID key |
| push.ts | subscribeToPush(subscription) | Save push sub |
| push.ts | unsubscribeFromPush(endpoint) | Remove push sub |
| push.ts | sendPushNotification(userId, payload) | Send web push |
| notification-preferences.ts | getPreferences() | Get/create defaults |
| notification-preferences.ts | updatePreferences(prefs) | Update prefs |

---

## Security

- All user-facing actions check authentication
- RLS policies restrict access to own notifications/preferences
- Notification creation uses service role (bypasses RLS)
- Link validation: only relative paths (`/`) accepted for navigation
- Push subscription keys encrypted via Web Push protocol
- Cron endpoint protected by CRON_SECRET bearer token

---

*Last updated: 2026-02-04*
