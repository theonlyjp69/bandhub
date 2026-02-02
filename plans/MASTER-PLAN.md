# BandHub - Master Plan

> **Quick Context:** See [CLAUDE.md](../CLAUDE.md) for project overview | [docs/README.md](../docs/README.md) for full documentation

## Project Vision

**BandHub** is a web application that helps bands manage communication, events, and coordination in one unified platform. Instead of juggling multiple apps (group chats, calendars, file sharing, spreadsheets), band members have one place for everything.

**Think:** Slack + Google Calendar + Trello, but built specifically for bands.

**Competitive Position:** Simple, modern band coordination tool. Not as complex as BandHelper or Back On Stage, but purpose-built for bands unlike Discord or group texts. See [Competitor Analysis](docs/03-logs/research/competitor-analysis.md).

---

## Target Users

- Musicians in bands who need to coordinate rehearsals, shows, and deadlines
- Band leaders/managers who organize the group
- Starting with a single band, scaling to multiple bands, eventually a public platform

**Primary:** Casual to semi-professional bands (3-8 members) - cover bands, original projects, worship teams, community groups.

---

## Core MVP Features

### 1. Authentication & Bands
- Sign in with Google
- Create bands (creator becomes admin)
- Invite members via email
- Accept/decline invitations
- Member roles: admin, member

### 2. Events & Calendar
- Event types: Shows, Rehearsals, Deadlines, Other
- Show-specific fields: venue, pay, load-in time, set length
- Calendar view (month/week) using react-big-calendar
- List view of upcoming events
- RSVP system: Going / Maybe / Can't Make It
- See [Event Management Patterns](docs/03-logs/research/event-management-patterns.md)

### 3. Communication
- Announcements (admin posts, members react/comment)
- Real-time group chat (Supabase Realtime)
- Topic-based discussion threads
- Unread indicators
- See [Communication Patterns](docs/03-logs/research/communication-patterns.md)

### 4. Availability Polling *(Added from research)*
- When2Meet-style grid for scheduling rehearsals
- Create poll with multiple time options
- Members mark available times
- Visual grid shows overlap
- Convert best time to event

### 5. File Storage *(Added from research)*
- Upload recordings, stems, setlists
- Organize files by band
- Share files with band members
- Supabase Storage integration

---

## Future Features (Post-MVP)

- Finance tracking (income, expenses, splits)
- Setlist builder
- Public band pages
- Mobile app (React Native)
- Direct messages (1:1)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (auth, database, realtime, storage) |
| Database | PostgreSQL |
| Calendar | react-big-calendar + shadcn/ui calendar |
| Hosting | Vercel (free tier) |

See [GitHub Resources](docs/03-logs/research/github-resources.md) for package details.

---

## Design Direction

- **Theme:** Dark mode default (Linear-inspired)
- **Accent Color:** Purple (#8b5cf6) - creative/music feel
- **UI Library:** shadcn/ui components
- **Responsive:** Mobile-first, card-based layouts

See [UI/UX Guidelines](docs/03-logs/research/ui-ux-guidelines.md) for full design system.

---

## Development Philosophy

1. **Research before building** - Understand competitors and best practices
2. **Backend before frontend** - Make it work before making it pretty
3. **Piece by piece** - One feature at a time, fully tested
4. **Test immediately** - Verify everything works before moving on
5. **QA everything** - Code review at every step
6. **Checkpoints** - Regular validation points

---

## Development Stages

| Stage | Name | Document |
|-------|------|----------|
| 0 | Research & Discovery | [STAGE-0-RESEARCH.md](./STAGE-0-RESEARCH.md) |
| 1 | Project Foundation & Database | [STAGE-1-FOUNDATION.md](./STAGE-1-FOUNDATION.md) |
| 2 | Authentication | [STAGE-2-AUTH.md](./STAGE-2-AUTH.md) |
| 3 | Band Management Backend | [STAGE-3-BANDS.md](./STAGE-3-BANDS.md) |
| 4 | Events & Availability Backend | [STAGE-4-EVENTS.md](./STAGE-4-EVENTS.md) |
| 5 | Communication Backend | [STAGE-5-COMMUNICATION.md](./STAGE-5-COMMUNICATION.md) |
| 6 | Integration Tests | [STAGE-6-TESTS.md](./STAGE-6-TESTS.md) |
| 7 | Functional UI | [STAGE-7-UI.md](./STAGE-7-UI.md) |
| 8 | Polish & Styling | [STAGE-8-POLISH.md](./STAGE-8-POLISH.md) |
| 9 | Deploy | [STAGE-9-DEPLOY.md](./STAGE-9-DEPLOY.md) |

---

## Success Criteria

The project is complete when:
- [ ] A user can sign in with Google
- [ ] A user can create a band and invite members
- [ ] Members can accept invites and join bands
- [ ] Anyone in a band can create events (shows, rehearsals, deadlines)
- [ ] Members can RSVP to events
- [ ] Members can create availability polls and find best times
- [ ] Members can upload and share files
- [ ] Members can send real-time chat messages
- [ ] Members can create and reply to discussion threads
- [ ] Admins can post announcements
- [ ] The app is deployed and accessible publicly
- [ ] The app works on mobile browsers
- [ ] Dark theme is implemented with purple accent

---

## Key Resources

**Research Output:** `docs/03-logs/research/` (Stage 0 Complete)
- [Competitor Analysis](docs/03-logs/research/competitor-analysis.md)
- [Task Management Patterns](docs/03-logs/research/task-management-patterns.md)
- [Event Management Patterns](docs/03-logs/research/event-management-patterns.md)
- [UI/UX Guidelines](docs/03-logs/research/ui-ux-guidelines.md)
- [Communication Patterns](docs/03-logs/research/communication-patterns.md)
- [GitHub Resources](docs/03-logs/research/github-resources.md)
- [Research Synthesis](docs/03-logs/research/research-synthesis.md)

**Database Migrations:** `supabase/migrations/`
**Server Actions:** `actions/`
**UI Components:** `components/`

---

## How to Use This Plan

1. Complete each stage in order
2. Do not skip stages
3. Do not move to the next stage until the checkpoint passes
4. Read the stage document before starting
5. Follow the testing requirements exactly
6. Ask the user for approval at each checkpoint
