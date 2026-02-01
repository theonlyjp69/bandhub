# Assumptions & Constraints

## Technical Assumptions

### Platform
- Users have access to modern web browsers (Chrome, Firefox, Safari, Edge)
- Mobile users primarily use responsive web, not native apps (for MVP)
- JavaScript is enabled in all target browsers
- Users have stable internet connectivity for real-time features

### Authentication
- Google OAuth is sufficient for initial launch
- Users have Google accounts or are willing to create one
- OAuth redirect flows work reliably across browsers

### Performance
- Supabase free tier provides adequate performance for early users
- Real-time subscriptions scale to 100+ concurrent users per band
- File uploads up to 50MB are acceptable for recordings/stems

### Infrastructure
- Vercel free tier handles expected traffic
- Supabase provides 99.9% uptime
- No need for CDN initially (Vercel handles edge caching)

## Business Assumptions

### Market
- Band coordination tools are underserved for small/casual bands
- Musicians prefer simple tools over feature-rich complex solutions
- Dark mode is preferred by creative/music-focused users
- Free tier with future premium features is viable business model

### User Behavior
- Bands have 3-8 active members typically
- Most bands have 1-2 "organizers" and several passive members
- Events happen weekly to monthly (rehearsals, shows)
- File sharing is occasional, not continuous

### Growth
- Word-of-mouth is primary acquisition channel for bands
- One user joining invites their entire band (viral coefficient)
- Bands are sticky - once adopted, switching cost is high

## Constraints

### Budget
- $0 infrastructure cost target (free tiers only)
- No paid services or APIs in MVP
- Self-service only, no customer support staff

### Time
- Development follows stage-based approach (10 stages)
- Each stage must pass checkpoint before proceeding
- No feature creep - strict MVP scope

### Technical
- Single developer or small team
- No custom backend - Supabase provides all backend services
- No mobile app development (responsive web only)
- No offline support initially

### Scope (MVP Boundaries)

**In Scope:**
- Google OAuth authentication
- Band creation and membership
- Email-based invitations
- Events with RSVPs
- Availability polling (When2Meet-style)
- Real-time group chat
- Discussion threads
- Announcements (admin-only posting)
- File storage and sharing

**Out of Scope (v2+):**
- Finance/expense tracking
- Setlist management
- Public band profiles
- Native mobile apps
- Direct messages (1:1)
- Calendar integrations (Google Calendar sync)
- Email notifications
- Push notifications

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase free tier limits exceeded | Medium | High | Monitor usage, plan upgrade path |
| Google OAuth issues | Low | High | Test thoroughly, have error handling |
| Real-time scaling issues | Medium | Medium | Design for graceful degradation |
| Mobile UX problems | Medium | Medium | Mobile-first design approach |
| User adoption challenges | High | High | Focus on core value, iterate quickly |

## Dependencies

### External Services
- **Supabase:** Auth, database, realtime, storage
- **Vercel:** Hosting, deployment, edge functions
- **Google Cloud:** OAuth provider

### Libraries
- Next.js 15 (App Router)
- Tailwind CSS + shadcn/ui
- react-big-calendar
- date-fns
- @supabase/supabase-js
- @supabase/ssr

---

*Last updated: Project initialization*
