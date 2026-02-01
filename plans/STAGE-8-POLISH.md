# Stage 8: Polish & Styling

## Context

You are building **BandHub**. The app works (Stage 7). Now you make it look good. Add shadcn/ui components, responsive design, and proper UX.

**Prerequisites:** Stage 7 complete, all features working.

**Research References:**
- [UI/UX Guidelines](C:\Users\jpcoo\docs\research\ui-ux-guidelines.md) - Design system and color palette
- [Task Management Patterns](C:\Users\jpcoo\docs\research\task-management-patterns.md) - Linear design patterns
- [Research Synthesis](C:\Users\jpcoo\docs\research\research-synthesis.md) - Approved design direction

---

## Design Direction (Approved)

From research synthesis:
- **Theme:** Dark mode default (Linear-inspired)
- **Accent Color:** Purple (#8b5cf6)
- **UI Library:** shadcn/ui components
- **Typography:** Inter font family
- **Responsive:** Mobile-first, card-based layouts

---

## Your Goal

1. Add shadcn/ui components
2. Implement dark theme with purple accent
3. Implement responsive design
4. Add loading and error states
5. Apply UI/UX guidelines from research

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `shadcn-ui` MCP | Get components, themes |
| `context7` MCP | Tailwind/shadcn docs |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Implement styling |
| `ui-designer` | Design guidance |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/review` | Code review |

---

## Task 8.1: Install shadcn/ui Components

**Use:** `shadcn-ui` MCP → `list_components`

Install these components:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add calendar
npx shadcn@latest add tabs
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add sidebar
npx shadcn@latest add scroll-area
npx shadcn@latest add separator
```

---

## Task 8.2: Apply Dark Theme with Purple Accent

**Update:** `app/globals.css`

Apply the color palette from [UI/UX Guidelines](C:\Users\jpcoo\docs\research\ui-ux-guidelines.md):

```css
@layer base {
  :root {
    /* Light mode (secondary) */
    --background: 0 0% 100%;
    --foreground: 0 0% 4%;
    --card: 0 0% 96%;
    --card-foreground: 0 0% 4%;
    --muted: 0 0% 90%;
    --muted-foreground: 0 0% 40%;
    --primary: 262 83% 58%;  /* Purple #8b5cf6 */
    --primary-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --border: 0 0% 90%;
    --ring: 262 83% 58%;
  }

  .dark {
    /* Dark mode (default) */
    --background: 0 0% 4%;      /* #0a0a0a */
    --foreground: 0 0% 98%;     /* #fafafa */
    --card: 0 0% 8%;            /* #141414 */
    --card-foreground: 0 0% 98%;
    --muted: 0 0% 15%;          /* #262626 */
    --muted-foreground: 0 0% 64%; /* #a3a3a3 */
    --primary: 262 83% 58%;     /* Purple #8b5cf6 */
    --primary-foreground: 0 0% 100%;
    --destructive: 0 62% 30%;
    --border: 0 0% 15%;
    --ring: 262 83% 58%;
  }
}
```

**Event type colors:**
```css
/* Event type badges */
.event-show { @apply bg-purple-500/20 text-purple-400 border-purple-500/30; }
.event-rehearsal { @apply bg-blue-500/20 text-blue-400 border-blue-500/30; }
.event-deadline { @apply bg-orange-500/20 text-orange-400 border-orange-500/30; }
.event-other { @apply bg-gray-500/20 text-gray-400 border-gray-500/30; }

/* RSVP status colors */
.rsvp-going { @apply bg-green-500/20 text-green-400; }
.rsvp-maybe { @apply bg-yellow-500/20 text-yellow-400; }
.rsvp-not-going { @apply bg-red-500/20 text-red-400; }
```

**Set dark mode as default:**
```tsx
// app/layout.tsx
<html lang="en" className="dark">
```

---

## Task 8.3: Create Layout Components

**Create:** `components/layout/navbar.tsx`

Navigation bar with:
- Logo/app name (BandHub)
- User avatar + dropdown (settings, sign out)
- Mobile hamburger menu
- Dark background with subtle border

**Create:** `components/layout/sidebar.tsx`

Band sidebar with (use shadcn sidebar block):
- Band name and icon
- Navigation links: Home, Calendar, Chat, Threads, Announcements, Members, Files, Availability
- Active state highlighting with purple accent
- Collapsible on desktop

**Create:** `components/layout/mobile-nav.tsx`

Bottom navigation for mobile:
- Home, Calendar, Chat, Files, More icons
- Purple active indicator
- Touch-friendly (44px minimum tap targets)

---

## Task 8.4: Style Auth Pages

**Update:** `app/login/page.tsx`

- Centered card on dark background
- BandHub logo/branding
- "Sign in with Google" button with Google icon
- Subtle purple gradient or accent
- "Your band's home base" tagline

---

## Task 8.5: Style Dashboard

**Update:** `app/(app)/dashboard/page.tsx`

- Band cards using shadcn Card component
- Each card shows band name, member count, recent activity
- Empty state with "Create your first band" CTA
- Invitation badge with count (purple badge)
- Grid layout on desktop, stack on mobile

---

## Task 8.6: Style Band Pages

**Update all band pages:**

- Consistent header with band name and purple accent
- Tab navigation using shadcn Tabs
- Proper spacing (Tailwind: p-4, gap-4, etc.)
- Inter font family
- Cards for content sections

---

## Task 8.7: Style Events & Calendar

**Update event pages:**

- Use react-big-calendar for calendar view
- Custom styling to match dark theme
- Event cards with type badges (colored per type)
- RSVP buttons:
  - Going = green background
  - Maybe = yellow background
  - Can't Make It = red background
- Event form with shadcn date picker
- Show-specific fields in collapsible section

**Style availability polling:**
- When2Meet-style grid with dark theme
- Purple for selected slots
- Gradient intensity for overlap visualization

---

## Task 8.8: Style Communication

**Update chat/thread pages:**

- Message bubbles with rounded corners
- Own messages aligned right (purple accent)
- Others' messages aligned left (muted background)
- Avatars next to messages
- Timestamp in muted text
- Input bar fixed at bottom with send icon
- Thread list with preview text (truncated)

---

## Task 8.9: Style Files Page

**Update files page:**

- File cards with icon based on mime type
- Upload zone with drag-and-drop
- Progress indicator during upload
- Download button with purple accent
- File size and uploader info in muted text

---

## Task 8.10: Add Loading States

**Create:** `components/ui/loading.tsx`

Use shadcn Skeleton for:
- Band list loading (card skeletons)
- Event list loading
- Message loading
- Member list loading
- File list loading

Every async page should show loading state:
```tsx
// app/(app)/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}
```

---

## Task 8.11: Add Error States

**Create:** `components/ui/error.tsx`

Handle:
- Network errors (show retry button)
- Not found (404) with helpful message
- Unauthorized (403) with login redirect
- Generic error fallback

Use `sonner` (shadcn toast) for non-blocking errors:
```tsx
import { toast } from 'sonner'
toast.error('Failed to save changes')
```

---

## Task 8.12: Responsive Design

Test and fix for:
- Desktop (1200px+): Full sidebar, multi-column layouts
- Tablet (768px - 1199px): Collapsible sidebar, adapted grids
- Mobile (< 768px): Bottom nav, single column, full-width cards

**Mobile priorities:**
- Bottom navigation instead of sidebar
- Touch-friendly buttons (min 44px tap targets)
- Readable text sizes (min 14px body)
- No horizontal scroll
- Swipe gestures for navigation (optional)

**Tailwind breakpoint usage:**
```tsx
<div className="flex flex-col md:flex-row">
  <aside className="hidden md:block w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
<nav className="fixed bottom-0 md:hidden">Mobile Nav</nav>
```

---

## Task 8.13: Add Microinteractions

Following Linear design patterns from research:

- Button hover states (subtle scale or brightness change)
- Loading spinners with purple accent
- Smooth page transitions
- Form validation feedback (immediate, not on submit)
- Toast notifications slide in from bottom
- Skeleton animations (shimmer effect)

---

## Checkpoint 8: Polished App

```
✓ Dark theme applied with purple accent
✓ All shadcn components installed and used
✓ Consistent Linear-inspired design language
✓ Responsive: works on mobile, tablet, desktop
✓ Loading states on all async operations
✓ Error handling with toast notifications
✓ Navigation is intuitive (sidebar + mobile nav)
✓ Forms have proper validation feedback
✓ Buttons have hover/active states
✓ Event types have distinct colors
✓ RSVP buttons clearly indicate status
✓ Files page styled with upload zone
✓ Availability grid styled with overlap visualization
✓ App looks professional and modern
```

**Visual QA Checklist:**
1. Test on desktop Chrome (dark mode)
2. Test on desktop Chrome (light mode if supported)
3. Test on mobile (Chrome DevTools or real device)
4. Test all event types (show, rehearsal, deadline, other)
5. Test all RSVP states
6. Test file upload and download
7. Test availability poll interaction
8. Screenshot key pages for review

**Use:** `playwright` MCP for visual regression tests
**Use:** `ui-designer` agent for design review

**Commit:** "Add polish and styling with dark theme"

**Next Stage:** [STAGE-9-DEPLOY.md](./STAGE-9-DEPLOY.md)
