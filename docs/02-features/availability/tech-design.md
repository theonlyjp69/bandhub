# Availability Polling - Technical Design

## Overview

When2Meet-style polling system that lets band members indicate availability across multiple time slots to find optimal meeting times.

## Database Schema

### availability_polls table
```sql
CREATE TABLE availability_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_options JSONB NOT NULL,  -- Array of {date, start_time, end_time}
  closes_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### availability_responses table
```sql
CREATE TABLE availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES availability_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  available_slots JSONB NOT NULL,  -- Array of selected slot indices
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
```

## Data Structures

### DateOption Interface
```typescript
interface DateOption {
  date: string         // ISO date: "2026-02-15"
  start_time: string   // HH:MM: "19:00"
  end_time: string     // HH:MM: "22:00"
}
```

### Poll Creation Input
```typescript
interface CreatePollInput {
  bandId: string
  title: string
  description?: string
  dateOptions: DateOption[]
  closesAt?: string  // ISO timestamp
}
```

## Server Actions

### actions/availability.ts

| Function | Purpose | Authorization |
|----------|---------|---------------|
| `createAvailabilityPoll(input)` | Create new poll | Band member |
| `getBandPolls(bandId)` | List all polls | Band member |
| `getPoll(pollId)` | Get poll with responses | Band member |
| `submitAvailability(pollId, slots)` | Submit/update response | Band member |
| `getUserAvailability(pollId)` | Get current user's response | Authenticated |
| `deletePoll(pollId)` | Delete poll | Creator or admin |
| `getBestTimeSlot(pollId)` | Calculate optimal slot | Band member |

## Data Flow

### Create Poll
```
Client → createAvailabilityPoll(input)
  → Verify authentication
  → Verify band membership
  → Cast dateOptions to Json
  → Insert into availability_polls
  → Return poll with id
```

### Submit Availability
```
Client → submitAvailability(pollId, [0, 2, 4])
  → Verify authentication
  → Get poll → verify band membership
  → Upsert into availability_responses
  → Return response
```

### Get Best Time
```
Client → getBestTimeSlot(pollId)
  → getPoll(pollId) (includes responses)
  → Count votes per slot index
  → Return slot with max votes
  → Return { slotIndex, dateOption, respondentCount, totalMembers }
```

## Best Time Calculation

```typescript
// Algorithm
const slotCounts: Record<number, number> = {}

responses.forEach(response => {
  const slots = response.available_slots as number[]
  slots.forEach(slotIndex => {
    slotCounts[slotIndex] = (slotCounts[slotIndex] || 0) + 1
  })
})

// Find max
let bestSlot = -1, maxCount = 0
Object.entries(slotCounts).forEach(([slot, count]) => {
  if (count > maxCount) {
    maxCount = count
    bestSlot = parseInt(slot)
  }
})
```

## RLS Policies

- SELECT: Band members can view polls/responses
- INSERT: Band members can create polls, own responses
- UPDATE: Creator/admin for polls, own user for responses
- DELETE: Creator/admin for polls, cascade for responses

## UI Integration

### Grid Display
```
         | Mon 2/15 | Tue 2/16 | Wed 2/17 |
7-10pm   | [x] [x]  | [x]      | [x] [x]  |
         | Alice    | Alice    | Bob      |
         | Bob      |          | Carol    |
```

### Color Coding
- Green: All members available
- Yellow: Majority available
- Red: Few/none available

## Type Handling

JSONB fields require casting:
```typescript
// Insert
date_options: input.dateOptions as unknown as Json

// Read
const dateOptions = poll.date_options as unknown as DateOption[]
```
