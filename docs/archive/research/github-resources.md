# GitHub & NPM Resources Research

## Executive Summary

Recommended stack for BandHub:
- **Starter**: Vercel's official Next.js + Supabase template
- **Calendar**: react-big-calendar or shadcn/ui calendar blocks
- **Chat**: Build with Supabase Realtime (examples available)
- **UI**: shadcn/ui components

All recommended packages are MIT licensed and actively maintained.

---

## Starter Templates

### Top Next.js + Supabase Starters

| Repository | Stars | Description | Link |
|------------|-------|-------------|------|
| **nextbase-nextjs-supabase-starter** | 766 | Full-featured boilerplate with Next.js 16+, Supabase, Tailwind CSS 4, TypeScript, ESLint, Prettier, Husky, Jest, Playwright, React Query | [GitHub](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) |
| vercel/nextjs-with-supabase | Official | Vercel's official starter template | [Vercel Templates](https://vercel.com/templates/next.js/supabase) |

### Recommended: nextbase-nextjs-supabase-starter

**Included Features**:
- Next.js 16+ with App Router
- Supabase (Auth, Database)
- Tailwind CSS 4
- TypeScript
- ESLint + Prettier
- Husky + Lint-Staged
- Jest + Testing Library
- Playwright (E2E)
- Commitizen + Commitlint
- React Query
- Vercel deployment ready

**Why This One**: Most comprehensive, actively maintained, includes testing setup.

### Alternative: Start from Scratch

Using Vercel's official `create-next-app` with Supabase:

```bash
npx create-next-app@latest bandhub --typescript --tailwind --eslint --app
cd bandhub
npx supabase init
npx shadcn@latest init
```

---

## Calendar Components

### NPM Package Comparison

| Package | Weekly Downloads | Stars | Last Updated | Best For |
|---------|------------------|-------|--------------|----------|
| **react-big-calendar** | 658K | 7.5K+ | Active | Full calendar views |
| react-calendar | 500K+ | 3.5K+ | Active | Date picker |
| react-calendar-timeline | 50K+ | 2K+ | Active | Timeline/Gantt |

### Recommended: react-big-calendar

**Website**: [jquense.github.io/react-big-calendar](http://jquense.github.io/react-big-calendar/)

**Features**:
- Month, week, day, agenda views
- Drag-and-drop events
- Event resizing
- Customizable styling (SASS variables)
- Multiple localizer options (Moment, date-fns, Day.js)
- TypeScript support

**Installation**:
```bash
npm install react-big-calendar
npm install date-fns  # or moment, dayjs
npm install @types/react-big-calendar --save-dev
```

**Basic Usage**:
```tsx
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dayjsLocalizer(dayjs)

function EventCalendar({ events }) {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
    />
  )
}
```

**License**: MIT

### Alternative: shadcn/ui Calendar Blocks

shadcn/ui includes 32 calendar block variations:
- Simple date pickers (calendar-01 to calendar-08)
- Date range selectors (calendar-09 to calendar-15)
- Event calendars (calendar-16 to calendar-32)

**Advantages**:
- Consistent with rest of UI
- Fully customizable (own the code)
- Tailwind-styled

**Disadvantages**:
- Less feature-complete than react-big-calendar
- May need more customization for full calendar views

**Recommendation**: Use react-big-calendar for main calendar, shadcn/ui calendar for date pickers.

---

## Real-Time Chat Examples

### Supabase Realtime Chat Repositories

| Repository | Stars | Stack | Link |
|------------|-------|-------|------|
| vue-supabase-chat | 23 | Vue.js + Supabase | [GitHub](https://github.com/LevinIgor/vue-supabase-chat) |
| supabase-realtime-chat (WDS) | 19 | React + Supabase | [GitHub](https://github.com/WebDevSimplified/supabase-realtime-chat) |
| Supabase-Realtime-Chat | 3 | Next.js + shadcn/ui + Supabase | [GitHub](https://github.com/scottXchoo/Supabase-Realtime-Chat) |
| supabase-realtime-chat-template | 2 | React/Next.js + Supabase | [GitHub](https://github.com/SamRome1/supabase-realtime-chat-template) |

### Recommended Reference: scottXchoo/Supabase-Realtime-Chat

**Stack**: Next.js + shadcn/ui + Supabase (matches BandHub stack)

**Features**:
- Real-time message updates
- User authentication with RLS
- Presence tracking
- Simple, extendable code

### Key Implementation Patterns

From these repos, the common patterns are:

```typescript
// 1. Subscribe to messages
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, handleNewMessage)
  .subscribe()

// 2. Track presence
const presenceChannel = supabase
  .channel('online-users')
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .subscribe()

// 3. Send message
const sendMessage = async (content: string) => {
  await supabase.from('messages').insert({
    content,
    user_id: user.id,
    band_id: bandId
  })
}
```

---

## Next.js + shadcn Templates

### Top Repositories

| Repository | Stars | Description | Link |
|------------|-------|-------------|------|
| webapp-template | 13 | Production-ready Next.js + shadcn | [GitHub](https://github.com/ravixstudio/webapp-template) |
| bolt-nextjs-shadcn-template | 4 | Fullstack template | [GitHub](https://github.com/thecodacus/bolt-nextjs-shadcn-template) |

### Vercel Official Templates

Vercel provides official shadcn/ui templates:
- [Admin Dashboard](https://vercel.com/templates/next.js/next-js-and-shadcn-ui-admin-dashboard)
- [Once UI Design Starter](https://vercel.com/templates/next.js/once-ui-design-for-nextjs)

**Recommendation**: Start with Vercel's official admin dashboard template for layout inspiration.

---

## NPM Packages to Install

### Core Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.93.0",
    "@supabase/auth-helpers-nextjs": "latest",
    "react-big-calendar": "^1.19.0",
    "date-fns": "^3.0.0"
  }
}
```

### UI Dependencies (via shadcn/ui)

```bash
npx shadcn@latest add button card calendar dialog dropdown-menu
npx shadcn@latest add form input label select tabs toast avatar badge
npx shadcn@latest add sidebar navigation-menu scroll-area separator
```

### Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-big-calendar": "^1.8.0",
    "tailwindcss": "^4.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## Supabase Packages

### Official Supabase Packages

| Package | Purpose | Version |
|---------|---------|---------|
| @supabase/supabase-js | Main SDK | 2.93.3 |
| @supabase/auth-js | Auth helpers | 2.93.3 |
| @supabase/storage-js | File storage | 2.93.3 |
| @supabase/functions-js | Edge functions | 2.93.3 |
| supabase | CLI tool | 2.74.5 |

### Installation

```bash
npm install @supabase/supabase-js
npm install -g supabase  # CLI for local development
```

### Next.js Auth Helpers

```bash
npm install @supabase/ssr
```

This package provides SSR-compatible auth helpers for Next.js App Router.

---

## License Compatibility

All recommended packages are MIT licensed:

| Package | License | Commercial Use | Modification | Distribution |
|---------|---------|----------------|--------------|--------------|
| Next.js | MIT | Yes | Yes | Yes |
| React | MIT | Yes | Yes | Yes |
| Supabase | Apache-2.0 | Yes | Yes | Yes |
| react-big-calendar | MIT | Yes | Yes | Yes |
| shadcn/ui | MIT | Yes | Yes | Yes |
| Tailwind CSS | MIT | Yes | Yes | Yes |
| date-fns | MIT | Yes | Yes | Yes |

**All clear for commercial use.**

---

## Recommended Project Setup

### Step 1: Create Project

```bash
npx create-next-app@latest bandhub --typescript --tailwind --eslint --app
cd bandhub
```

### Step 2: Initialize Supabase

```bash
npx supabase init
npx supabase start  # Local development
```

### Step 3: Add shadcn/ui

```bash
npx shadcn@latest init
```

Choose:
- Style: New York
- Base color: Neutral
- CSS variables: Yes

### Step 4: Install Core Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install react-big-calendar date-fns
npm install @types/react-big-calendar --save-dev
```

### Step 5: Add shadcn Components

```bash
npx shadcn@latest add button card dialog form input label
npx shadcn@latest add avatar badge calendar dropdown-menu
npx shadcn@latest add sidebar tabs toast scroll-area
```

---

## Additional Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [react-big-calendar Docs](http://jquense.github.io/react-big-calendar/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Tutorials

- [Supabase + Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)

---

## Sources

- [nextbase-nextjs-supabase-starter](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter)
- [react-big-calendar NPM](https://www.npmjs.com/package/react-big-calendar)
- [react-big-calendar GitHub](https://github.com/jquense/react-big-calendar)
- [Supabase-Realtime-Chat](https://github.com/scottXchoo/Supabase-Realtime-Chat)
- [supabase-realtime-chat-template](https://github.com/SamRome1/supabase-realtime-chat-template)
- [Vercel Admin Dashboard Template](https://vercel.com/templates/next.js/next-js-and-shadcn-ui-admin-dashboard)
- [@supabase/supabase-js NPM](https://www.npmjs.com/package/@supabase/supabase-js)
