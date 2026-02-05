# Product Requirements Document (PRD)

## Product Overview

**Product Name:** BandHub
**Version:** 1.0 (MVP)
**Target Release:** TBD

### Executive Summary

BandHub is a web application for band coordination that unifies communication, event scheduling, availability polling, and file sharing into a single platform designed specifically for musicians.

---

## Goals & Success Criteria

### Business Goals
1. Provide a free, purpose-built coordination tool for small bands
2. Establish market presence in underserved band management space
3. Build foundation for future premium features

### User Goals
1. Reduce coordination overhead for band activities
2. Centralize band communication and resources
3. Simplify event scheduling with availability awareness

### Success Criteria
| Metric | Target |
|--------|--------|
| Time to create band | < 2 minutes |
| Clicks to RSVP to event | < 3 clicks |
| Real-time message latency | < 1 second |
| Mobile usability score | 90+ (Lighthouse) |
| Infrastructure cost | $0 (free tier) |

---

## User Personas

### Persona 1: Band Leader (Alex)
- **Role:** Lead vocalist, band organizer
- **Goals:** Keep band organized, schedule rehearsals, share setlists
- **Pain Points:** Chasing members for availability, scattered files, missed communications
- **Usage:** Daily - checks app for updates, creates events, posts announcements

### Persona 2: Band Member (Jordan)
- **Role:** Bassist, casual member
- **Goals:** Know when/where to show up, get setlists, stay in the loop
- **Pain Points:** Missing event details, notification overload, can't find files
- **Usage:** Weekly - checks events, responds to polls, reads announcements

---

## Feature Requirements

### F1: Authentication
**Priority:** P0 (Required)

| Requirement | Description |
|-------------|-------------|
| F1.1 | Sign in with Google OAuth |
| F1.2 | Auto-create user profile on first sign-in |
| F1.3 | Protected routes redirect to login |
| F1.4 | Sign out clears session |
| F1.5 | Session persists across page refreshes |

### F2: Band Management
**Priority:** P0 (Required)

| Requirement | Description |
|-------------|-------------|
| F2.1 | Create new band (name, description) |
| F2.2 | Creator becomes band admin |
| F2.3 | View list of user's bands |
| F2.4 | View single band details |
| F2.5 | Invite members via email |
| F2.6 | Accept/decline invitations |
| F2.7 | View band members with roles |
| F2.8 | Admin can update member roles |
| F2.9 | Admin can remove members |

### F3: Events & Calendar
**Priority:** P0 (Required)

| Requirement | Description |
|-------------|-------------|
| F3.1 | Create events with type (show, rehearsal, deadline, other) |
| F3.2 | Event fields: title, date/time, location, description |
| F3.3 | Show-specific metadata: venue, pay, load-in time |
| F3.4 | View events in list format |
| F3.5 | View events in calendar format |
| F3.6 | RSVP to events (going, maybe, can't make it) |
| F3.7 | Update own RSVP |
| F3.8 | View all RSVPs for an event |
| F3.9 | Delete events |

### F4: Availability Polling
**Priority:** P1 (Important)

| Requirement | Description |
|-------------|-------------|
| F4.1 | Create availability poll with multiple time slots |
| F4.2 | Members mark available slots |
| F4.3 | View all responses in grid format |
| F4.4 | Visual indicator of overlap (darker = more available) |
| F4.5 | Identify best time slot automatically |
| F4.6 | Convert poll result to event |

### F5: File Storage
**Priority:** P1 (Important)

| Requirement | Description |
|-------------|-------------|
| F5.1 | Upload files to band storage |
| F5.2 | File metadata: name, description, size, type |
| F5.3 | View list of band files |
| F5.4 | Download files via signed URL |
| F5.5 | Delete own uploaded files |
| F5.6 | Storage organized by band |

### F6: Communication
**Priority:** P0 (Required)

| Requirement | Description |
|-------------|-------------|
| F6.1 | Real-time group chat per band |
| F6.2 | Messages show sender and timestamp |
| F6.3 | New messages appear instantly (< 1s) |
| F6.4 | Create discussion threads |
| F6.5 | Reply to threads |
| F6.6 | Thread message counts visible |
| F6.7 | Admin-only announcements |
| F6.8 | View announcements list |

### F7: UI/UX
**Priority:** P0 (Required)

| Requirement | Description |
|-------------|-------------|
| F7.1 | Dark mode default |
| F7.2 | Purple accent color (#8b5cf6) |
| F7.3 | Mobile responsive design |
| F7.4 | Loading states for async operations |
| F7.5 | Error handling with toast notifications |
| F7.6 | Sidebar navigation on desktop |
| F7.7 | Bottom navigation on mobile |

---

## Non-Functional Requirements

### Performance
- Page load time < 3 seconds
- Real-time message delivery < 1 second
- File upload supports up to 50MB

### Security
- Row Level Security (RLS) on all database tables
- Protected routes via middleware
- Signed URLs for file downloads (1 hour expiry)
- No secrets in client-side code

### Scalability
- Support 100+ concurrent users per band
- Support bands with 50+ members
- Support 1000+ messages per band

### Accessibility
- Minimum 44px touch targets on mobile
- Readable text sizes (min 14px body)
- Color contrast meets WCAG AA

### Browser Support
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (auth, database, realtime, storage) |
| Database | PostgreSQL |
| Calendar | List view (react-big-calendar installed but unused - simpler mobile-first UX) |
| Hosting | Vercel |

---

## Out of Scope (v1)

- Finance/expense tracking
- Setlist management
- Public band profiles
- Native mobile apps
- Direct messages (1:1)
- Calendar sync (Google Calendar)
- Email notifications
- Push notifications
- Offline support

---

## Acceptance Criteria

The MVP is complete when:

- [ ] User can sign in with Google
- [ ] User can create a band and invite members
- [ ] Members can accept invites and join bands
- [ ] Anyone in a band can create events
- [ ] Members can RSVP to events
- [ ] Members can create availability polls and find best times
- [ ] Members can upload and share files
- [ ] Members can send real-time chat messages
- [ ] Members can create and reply to discussion threads
- [ ] Admins can post announcements
- [ ] App is deployed and accessible publicly
- [ ] App works on mobile browsers
- [ ] Dark theme is implemented with purple accent

---

*Source: [plans/MASTER-PLAN.md](../../plans/MASTER-PLAN.md)*
