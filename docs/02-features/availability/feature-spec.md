# Availability Polling Feature Specification

## Overview

Availability polling provides When2Meet-style scheduling for bands. Members can create polls with multiple time slots, and other members mark their availability. The system identifies the best time when most members are available.

## User Stories

### US-AVAIL-1: Create Availability Poll
**As a** band member
**I want to** create a poll with multiple time options
**So that** I can find when everyone is available

**Acceptance Criteria:**
- Form with title, description, closing date
- Add multiple date/time slots
- Poll visible to all band members

### US-AVAIL-2: Submit Availability
**As a** band member
**I want to** mark which times I'm available
**So that** the organizer can find the best time

**Acceptance Criteria:**
- Checkbox for each time slot
- Can update availability at any time
- See my current selections

### US-AVAIL-3: View Results
**As a** band member
**I want to** see everyone's availability
**So that** I can understand scheduling options

**Acceptance Criteria:**
- Grid showing all members and slots
- Visual indicator of overlap (darker = more available)
- Best time slot highlighted

### US-AVAIL-4: Convert to Event
**As a** band member
**I want to** create an event from the best time
**So that** I can finalize the schedule

**Acceptance Criteria:**
- Button to create event from poll
- Pre-fills event with poll details
- Links poll to resulting event

## Data Model

### availability_polls table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| title | TEXT | Poll title (required) |
| description | TEXT | Poll description |
| date_options | JSONB | Array of {date, start_time, end_time} |
| closes_at | TIMESTAMPTZ | When poll closes |
| created_by | UUID | References profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |

### availability_responses table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| poll_id | UUID | References availability_polls |
| user_id | UUID | References profiles |
| available_slots | JSONB | Array of selected slot indices |
| created_at | TIMESTAMPTZ | Response timestamp |

**Constraints:** UNIQUE(poll_id, user_id) - one response per user per poll

## Date Options Format

```json
[
  {
    "date": "2024-06-15",
    "start_time": "14:00",
    "end_time": "17:00"
  },
  {
    "date": "2024-06-16",
    "start_time": "10:00",
    "end_time": "13:00"
  }
]
```

## Available Slots Format

```json
[0, 2, 3]  // Indices of selected date_options
```

## Security

### RLS Policies
- Band members can view polls
- Band members can create polls
- Band members can view all responses
- Users can manage their own responses

## Algorithm: Find Best Time

```typescript
function getBestTimeSlot(poll, responses) {
  const slotCounts = {}

  responses.forEach(response => {
    response.available_slots.forEach(slotIndex => {
      slotCounts[slotIndex] = (slotCounts[slotIndex] || 0) + 1
    })
  })

  const bestSlot = Object.entries(slotCounts)
    .sort((a, b) => b[1] - a[1])[0]

  return {
    slotIndex: bestSlot[0],
    dateOption: poll.date_options[bestSlot[0]],
    respondentCount: bestSlot[1]
  }
}
```

## UI Components

### Poll List (`/band/[id]/availability`)
- List of polls with response counts
- Status badges (open/closed)
- "Create Poll" button

### Create Poll (`/band/[id]/availability/new`)
- Title input
- Description textarea
- Date/time slot builder (add/remove slots)
- Closes at date picker
- Submit button

### Poll Details (`/band/[id]/availability/[pollId]`)
- Poll title and description
- Time slot checkboxes for user response
- "Save Availability" button
- Results grid showing all responses
- Best time highlighted
- "Create Event from Best Time" button

---

*Implementation: [plans/STAGE-4-EVENTS.md](../../../plans/STAGE-4-EVENTS.md)*
