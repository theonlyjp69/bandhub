# Events & RSVPs - Technical Design

## Overview

Events represent band activities (shows, rehearsals, deadlines) with associated RSVP functionality for member attendance tracking.

## Database Schema

### events table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('show', 'rehearsal', 'deadline', 'other')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### event_rsvps table
```sql
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('going', 'maybe', 'not_going')),
  UNIQUE(event_id, user_id)
);
```

## Server Actions

### actions/events.ts

| Function | Purpose | Authorization |
|----------|---------|---------------|
| `createEvent(input)` | Create new event | Band member |
| `updateEvent(eventId, updates)` | Update event details | Creator or admin |
| `deleteEvent(eventId)` | Delete event | Creator or admin |
| `getBandEvents(bandId)` | List all band events | Band member |
| `getEvent(eventId)` | Get single event with RSVPs | Band member |
| `getUpcomingEvents(bandId, limit)` | Get future events | Band member |

### actions/rsvps.ts

| Function | Purpose | Authorization |
|----------|---------|---------------|
| `setRsvp(eventId, status)` | Create/update RSVP | Band member |
| `getEventRsvps(eventId)` | List all RSVPs | Band member |
| `getUserRsvp(eventId)` | Get current user's RSVP | Authenticated |
| `removeRsvp(eventId)` | Delete user's RSVP | Own RSVP only |

## Data Flow

### Create Event
```
Client → createEvent(input)
  → Verify authentication
  → Verify band membership
  → Insert into events table
  → Return event with id
```

### RSVP Flow
```
Client → setRsvp(eventId, 'going')
  → Verify authentication
  → Get event → verify band membership
  → Upsert into event_rsvps (onConflict: event_id,user_id)
  → Return updated RSVP
```

## Metadata Schema

The `metadata` JSONB field supports event-type specific data:

```typescript
// Show metadata
{
  venue: string,
  pay: number,
  load_in_time: string,
  set_time: string,
  door_time: string,
  age_restriction: string,
  ticket_link: string
}

// Rehearsal metadata
{
  room: string,
  set_list: string[]
}
```

## RLS Policies

- SELECT: Band members can view events
- INSERT: Band members can create events
- UPDATE: Creator or admin can update
- DELETE: Creator or admin can delete (RSVPs cascade)

## Integration Points

- **Calendar UI:** Uses react-big-calendar with getBandEvents()
- **Dashboard:** Uses getUpcomingEvents(limit=5) for preview
- **Notifications:** (Future) Alert on new events, RSVP changes
