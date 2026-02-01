# Events & Calendar Feature Specification

## Overview

Events are the primary coordination tool in BandHub. Band members can create events for shows, rehearsals, deadlines, and other activities. Each event supports RSVPs so organizers know who's attending.

## User Stories

### US-EVENT-1: Create Event
**As a** band member
**I want to** create events for my band
**So that** everyone knows what's happening

**Acceptance Criteria:**
- Form with title, type, date/time, location, description
- Show-specific fields: venue, pay, load-in time
- Event appears in band calendar

### US-EVENT-2: View Calendar
**As a** band member
**I want to** see all band events on a calendar
**So that** I can plan my schedule

**Acceptance Criteria:**
- Calendar view (month/week)
- List view of upcoming events
- Events color-coded by type

### US-EVENT-3: RSVP to Event
**As a** band member
**I want to** RSVP to events
**So that** the organizer knows if I'm attending

**Acceptance Criteria:**
- Three RSVP options: Going, Maybe, Can't Make It
- Can change RSVP at any time
- See other members' RSVPs

### US-EVENT-4: View Event Details
**As a** band member
**I want to** see full event details
**So that** I have all the information I need

**Acceptance Criteria:**
- All event fields displayed
- RSVP list with member names
- My current RSVP status highlighted

## Data Model

### events table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| title | TEXT | Event title (required) |
| event_type | TEXT | 'show', 'rehearsal', 'deadline', 'other' |
| start_time | TIMESTAMPTZ | Start date/time (required) |
| end_time | TIMESTAMPTZ | End date/time |
| location | TEXT | Event location |
| description | TEXT | Event details |
| metadata | JSONB | Type-specific data (venue, pay, etc.) |
| created_by | UUID | References profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |

### event_rsvps table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | References events |
| user_id | UUID | References profiles |
| status | TEXT | 'going', 'maybe', 'not_going' |

**Constraints:** UNIQUE(event_id, user_id) - one RSVP per user per event

## Event Types

| Type | Color | Extra Fields |
|------|-------|--------------|
| Show | Purple | venue, pay, load_in_time, set_length |
| Rehearsal | Blue | - |
| Deadline | Orange | - |
| Other | Gray | - |

## Security

### RLS Policies
- Band members can view events
- Band members can create events
- Users can manage their own RSVPs

## UI Components

### Calendar View (`/band/[id]/calendar`)
- react-big-calendar component
- Month and week views
- Click event to view details
- "Create Event" button

### Event List View
- Upcoming events sorted by date
- Event cards with type badge
- Quick RSVP buttons

### Create Event (`/band/[id]/events/new`)
- Title input
- Event type select
- Date/time pickers
- Location input
- Description textarea
- Conditional show fields

### Event Details (`/band/[id]/events/[eventId]`)
- Full event information
- RSVP buttons (Going/Maybe/Can't Make It)
- RSVP list by status
- Edit/Delete (creator or admin)

---

*Implementation: [plans/STAGE-4-EVENTS.md](../../../plans/STAGE-4-EVENTS.md)*
