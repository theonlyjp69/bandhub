# Event/Calendar Management Patterns Research

## Executive Summary

Key patterns from calendar/scheduling tools:
- **Multiple views** (month, week, day, list) are essential
- **RSVP systems** need simple Yes/No/Maybe + counts
- **Color coding** by event type helps scanning
- **Availability polling** (When2Meet style) is separate from events
- **Minimal clicks** to view and respond to events

For BandHub, implement month/week calendar + list view with inline RSVP.

---

## Tool Deep Dives

### Google Calendar

**Core RSVP Patterns**:

**Response Options**:
- Yes (Going)
- No (Not Going)
- Maybe

**Additional Actions**:
- Propose new time
- Add note to response
- See who else is attending

**Event Creator Features**:
- Real-time RSVP tracking
- See all responses in one view
- Notification when RSVPs change
- Guest permission controls:
  - Can modify event
  - Can invite others
  - Can see guest list

**Key UX Patterns**:
- Responses update automatically
- Creator gets real-time headcount
- Simple three-button RSVP
- Alternative time suggestions built-in

**Takeaway for BandHub**: Three-option RSVP is the standard. Consider "Propose new time" for scheduling conflicts.

---

### Calendly

**Website**: [calendly.com](https://calendly.com/)

**Core Philosophy**: Show availability, not unavailability.

**Key UX Patterns**:

**Unified Availability View**:
- Month and day on one screen
- Only shows bookable slots
- Hides unavailable times completely
- Color indicates availability level

**Design Decisions**:
- Reduced scheduling from 7 steps to 4
- Familiar calendar layout (like Google Calendar)
- Visual feedback when interacting with times
- Time zone auto-detection

**Multi-Calendar Integration**:
- Syncs up to 6 calendars
- Prevents double-booking automatically
- Real-time availability updates

**Takeaway for BandHub**: Focus on what's possible, not what's blocked. Keep flows minimal.

---

### When2Meet

**Website**: [when2meet.com](https://www.when2meet.com/)

**Core Philosophy**: Quick group availability polling, no accounts.

**Key UX Patterns**:

**Visual Grid Availability**:
- Drag to select available times
- Color-coded by number of people available
- Darker = more people available
- Instant visual consensus

**Zero Friction**:
- No account required
- No sign-up for participants
- Just enter name and select times
- Share link, done

**Best For**: One-time event scheduling, casual groups

**Limitations**:
- Not for recurring events
- No calendar integration
- No reminders
- Basic UI (but effective)

**Takeaway for BandHub**: For rehearsal scheduling, a When2Meet-style availability grid could be valuable as a future feature.

---

### Doodle

**Website**: [doodle.com](https://doodle.com/)

**Core Philosophy**: Poll-based scheduling with calendar integration.

**Key Features**:
- Poll multiple time options
- Integrates with Google, Outlook, iCal
- Automatic reminders (paid)
- Participants can see each other's responses
- Professional appearance

**Comparison to When2Meet**:
| Feature | When2Meet | Doodle |
|---------|-----------|--------|
| Price | Free | Freemium |
| Account Required | No | Creator only |
| Calendar Sync | No | Yes |
| Reminders | No | Paid |
| UI Polish | Basic | Professional |

**Takeaway for BandHub**: Calendar integration matters for professional feel. Start simple like When2Meet, add integration later.

---

## Calendar UI Best Practices

### Essential View Patterns

**Month View**:
- Grid of days showing the full month
- Dots or mini-badges for events
- Click day to see events
- Quick navigation between months

**Week View**:
- 7-day horizontal or vertical layout
- Events shown as blocks with duration
- Better for seeing event details
- Good for dense schedules

**Day View**:
- Hourly breakdown
- Full event details visible
- Best for day-of planning

**List View**:
- Chronological event list
- "Time buckets" - Today, This Week, This Month
- Easier to scan quickly
- Best for sparse schedules

### Visual Design Patterns

**Color Coding**:
```
Shows     → Purple/Red (high importance)
Rehearsals → Blue (recurring)
Deadlines  → Orange (attention needed)
Other      → Gray (neutral)
```

**Visual Hierarchy**:
1. Event title (most prominent)
2. Date/time
3. Location/venue
4. RSVP status
5. Secondary details

**Status Indicators**:
- Confirmed events → Solid color
- Tentative → Striped/hatched
- Canceled → Strikethrough + muted

### Interaction Patterns

**Quick Add**:
- Click on day → Quick add modal
- Type event name → Auto-create
- Drag on calendar → Create with time range

**Event Editing**:
- Click event → Popover with details
- Edit in place when possible
- Full modal for complex edits

**Navigation**:
- Arrow keys for day/week navigation
- Today button always visible
- Swipe on mobile

### RSVP Patterns

**Simple Three-State**:
```
[ Going ]  [ Maybe ]  [ Can't Make It ]
    ✓          ?              ✗
```

**With Counts**:
```
Going (5)  |  Maybe (2)  |  Can't (1)  |  No Response (3)
```

**With Avatars**:
```
Going: [Avatar] [Avatar] [Avatar] +2
Maybe: [Avatar] [Avatar]
```

### Accessibility Considerations

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Arrow keys, Enter to select |
| Screen reader | ARIA labels on dates/events |
| Color independence | Icons + text, not just color |
| Dark mode | Proper contrast ratios |
| Time zones | Clear display, auto-detect |

---

## Recommendations for BandHub

### Must-Have Features

1. **Month View**
   - Shows full month at glance
   - Event dots with type colors
   - Click to see day's events
   - Navigate between months easily

2. **List View**
   - Upcoming events chronologically
   - Grouped by time bucket (Today, This Week, etc.)
   - Inline RSVP buttons
   - Quick scan of what's coming

3. **Simple RSVP**
   - Three options: Going / Maybe / Can't
   - One-click to respond
   - See others' responses
   - Change response anytime

4. **Event Types with Colors**
   - Show (featured color)
   - Rehearsal (secondary color)
   - Deadline (warning color)
   - Other (neutral)

### Nice-to-Have Features

1. **Week View**
   - For bands with dense schedules
   - Shows time blocks clearly
   - Good for seeing overlaps

2. **Availability Polling**
   - When2Meet-style grid
   - For scheduling rehearsals
   - Link to share with band

3. **Calendar Export/Sync**
   - Export to Google Calendar
   - iCal feed subscription
   - Two-way sync (complex)

### Skip for MVP

1. **Day View** - Overkill for band events
2. **Recurring Events** - Complex to implement well
3. **Drag-to-create** - Nice but not essential
4. **Multi-timezone** - Bands are usually local

---

## Event Data Model Suggestions

```
Event {
  id
  band_id
  title
  description
  type: "show" | "rehearsal" | "deadline" | "other"
  start_time
  end_time (optional)
  all_day: boolean

  // Show-specific
  venue
  address
  pay
  load_in_time
  set_length

  created_by
  created_at
}

RSVP {
  event_id
  user_id
  status: "going" | "maybe" | "not_going"
  note (optional)
  responded_at
}
```

---

## Sources

- [Google Calendar RSVP Help](https://support.google.com/calendar/answer/37135)
- [Design Google Calendar System Design](https://systemdesignschool.io/problems/google-calendar/solution)
- [Calendly Scheduling Page UI](https://calendly.com/blog/new-scheduling-page-ui)
- [Calendly Redesign Case Study](https://www.aubergine.co/insights/ux-re-design-experiments-elevating-calendlys-one-on-one-event-type-feature)
- [When2Meet](https://www.when2meet.com/)
- [Doodle vs When2Meet Comparison](https://calday.com/blog/when2meet-vs-doodle)
- [Calendar UI Examples](https://www.eleken.co/blog-posts/calendar-ui)
- [Calendar Design Best Practices](https://pageflows.com/resources/exploring-calendar-design/)
- [Design Considerations for Event Calendars](https://ui-patterns.com/blog/Design-considerations-for-event-calendars)
- [Calendar UX Best Practices](https://medium.com/design-bootcamp/best-practices-for-calendar-design-fix-ux-dc57b62d9bb7)
