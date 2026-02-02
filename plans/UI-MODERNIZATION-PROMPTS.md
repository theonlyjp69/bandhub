# BandHub UI/UX Modernization - Segmented AI Prompts

> **Source Plan:** `C:\Users\jpcoo\.claude\plans\noble-frolicking-cupcake.md`
> **Execution Style:** Sequential phases with checkpoints and documentation references
> **Total Phases:** 10 executable segments

---

## How to Use This Plan

Each segment below is a **self-contained AI prompt**. Copy the entire segment into a new chat session. The AI will:
1. Reference the specified documentation
2. Execute the tasks
3. Run verification commands
4. Update documentation before completing

**Critical Rules:**
- Execute segments IN ORDER (dependencies exist)
- Do NOT skip verification steps
- Update documentation after each segment
- Run `npm run build` after every code change

---

# SEGMENT 0: Documentation Discovery & Research Log

## Prompt for AI

```
You are implementing Phase 0 of the BandHub UI Modernization project.

## Your Task
Create the research documentation foundation before any code changes.

## Step 1: Query Documentation (REQUIRED FIRST)

Use the Context7 MCP tools to retrieve current documentation:

1. Resolve library ID for shadcn-ui:
   - Tool: mcp__plugin_context7_context7__resolve-library-id
   - libraryName: "shadcn-ui"
   - query: "theming CSS variables dark theme color system"

2. Query shadcn/ui theming docs:
   - Tool: mcp__plugin_context7_context7__query-docs
   - libraryId: "/websites/ui_shadcn"
   - query: "theming CSS variables dark theme customization globals.css oklch"

3. Resolve library ID for Tailwind:
   - Tool: mcp__plugin_context7_context7__resolve-library-id
   - libraryName: "tailwindcss"
   - query: "CSS custom properties animations keyframes"

4. Query Tailwind animation docs:
   - Tool: mcp__plugin_context7_context7__query-docs
   - libraryId: "/websites/tailwindcss"
   - query: "custom animations keyframes CSS variables dark mode oklch"

## Step 2: Read Current Implementation

Read these files to understand current state:
- app/globals.css (lines 1-150)
- components/ui/card.tsx
- components/ui/skeleton.tsx

## Step 3: Create Research Log

Create file: docs/03-logs/research/ui-modernization-research.md

Content must include:
1. Documentation sources consulted (with URLs)
2. Current BandHub color values extracted from globals.css
3. Dribbble findings from the source plan
4. Recommended color tokens with oklch values
5. Shadow scale recommendations
6. Typography scale recommendations
7. Anti-patterns to avoid

## Step 4: Verification Checklist

Run these commands and confirm success:
- [ ] File exists: `ls docs/03-logs/research/ui-modernization-research.md`
- [ ] File contains "oklch" color values
- [ ] File contains "Anti-Patterns" section
- [ ] No syntax errors in markdown

## Anti-Patterns (DO NOT DO)
- Do not modify any code files in this phase
- Do not invent color values without documenting source
- Do not skip the Context7 documentation queries

## Success Criteria
- Research log file created with all sections
- All documentation sources cited
- Current vs. proposed color values documented
```

### Checkpoint 0 ✅ COMPLETE (2026-02-02)
- [x] `docs/03-logs/research/ui-modernization-research.md` exists
- [x] Contains shadcn/ui theming documentation reference
- [x] Contains Tailwind CSS documentation reference
- [x] Contains current BandHub color analysis
- [x] Contains proposed design tokens

---

# SEGMENT 1: Color System Overhaul

## Prompt for AI

```
You are implementing Phase 1 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENT 0 must be complete
- Read: docs/03-logs/research/ui-modernization-research.md

## Your Task
Update the color system in globals.css to increase contrast and add color variety.

## Step 1: Query Documentation (REQUIRED)

Query Context7 for shadcn/ui theming patterns:
- Tool: mcp__plugin_context7_context7__query-docs
- libraryId: "/websites/ui_shadcn"
- query: "CSS variables dark theme oklch color customization"

## Step 2: Read Current File

Read: app/globals.css (full file)

Document the current values you find for:
- --background (dark mode)
- --card (dark mode)
- --border (dark mode)
- --primary

## Step 3: Update Color Values

Modify app/globals.css with these EXACT changes in the .dark {} section:

BEFORE → AFTER:
--background: oklch(0.13 0 0) → oklch(0.08 0.01 285)
--card: oklch(0.17 0 0) → oklch(0.14 0.01 285)
--border: oklch(1 0 0 / 10%) → oklch(1 0 0 / 15%)

ADD these NEW variables in .dark {} section (after existing variables):
--card-elevated: oklch(0.18 0.01 285);
--border-strong: oklch(1 0 0 / 25%);
--accent-secondary: oklch(0.75 0.15 195);
--accent-secondary-foreground: oklch(0.1 0 0);
--primary-gradient-start: oklch(0.65 0.25 290);
--primary-gradient-end: oklch(0.50 0.25 280);
--surface-1: oklch(0.10 0.01 285);
--surface-2: oklch(0.12 0.01 285);
--surface-3: oklch(0.16 0.01 285);

## Step 4: Add Tailwind Theme Mappings

In the @theme inline {} section, add mappings for new variables:
--color-card-elevated: var(--card-elevated);
--color-border-strong: var(--border-strong);
--color-accent-secondary: var(--accent-secondary);
--color-accent-secondary-foreground: var(--accent-secondary-foreground);
--color-surface-1: var(--surface-1);
--color-surface-2: var(--surface-2);
--color-surface-3: var(--surface-3);

## Step 5: Verification Commands

Run and confirm all pass:
```bash
npm run build
```

Visual verification in browser:
- Start dev server: npm run dev
- Navigate to /dashboard
- Cards should visibly "pop" from background
- Borders should be more visible than before

## Step 6: Update Documentation

Update docs/03-logs/research/ui-modernization-research.md:
- Add "Phase 1 Complete" section
- List all color values changed
- Note any issues encountered

## Anti-Patterns (DO NOT DO)
- Do not remove existing CSS variables
- Do not use hex colors (maintain oklch)
- Do not exceed 0.25 lightness for dark theme cards
- Do not change light mode values unless specified

## Success Criteria
- npm run build passes with no errors
- Card contrast visibly improved in browser
- All new variables added
- Documentation updated
```

### Checkpoint 1 ✅ COMPLETE (2026-02-02)
- [x] `npm run build` passes
- [x] globals.css contains new surface variables
- [x] globals.css contains gradient variables
- [x] Visual verification: cards have more contrast
- [x] Research log updated with Phase 1 status

---

# SEGMENT 2: Shadow & Elevation System

## Prompt for AI

```
You are implementing Phase 2 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-1 must be complete
- Read: docs/03-logs/research/ui-modernization-research.md

## Your Task
Create a consistent shadow hierarchy for depth perception.

## Step 1: Read Current Files

Read these files:
- app/globals.css
- components/ui/card.tsx

Note current shadow usage (should be "shadow-sm" on Card).

## Step 2: Add Shadow Custom Properties

In app/globals.css, add these variables in the :root {} section (shadows work same in light/dark):

/* Elevation system */
--shadow-xs: 0 1px 2px oklch(0 0 0 / 20%);
--shadow-sm: 0 2px 4px oklch(0 0 0 / 20%), 0 1px 2px oklch(0 0 0 / 30%);
--shadow-md: 0 4px 8px oklch(0 0 0 / 25%), 0 2px 4px oklch(0 0 0 / 20%);
--shadow-lg: 0 8px 16px oklch(0 0 0 / 30%), 0 4px 8px oklch(0 0 0 / 20%);
--shadow-xl: 0 12px 24px oklch(0 0 0 / 35%), 0 6px 12px oklch(0 0 0 / 25%);

/* Glow effects for accents */
--shadow-primary-glow: 0 0 20px oklch(0.585 0.233 288 / 30%);
--shadow-primary-glow-lg: 0 0 40px oklch(0.585 0.233 288 / 40%);

## Step 3: Add Utility Classes

In app/globals.css, add these utility classes in @layer base {} or after it:

/* Elevation utilities */
.elevation-1 { box-shadow: var(--shadow-sm); }
.elevation-2 { box-shadow: var(--shadow-md); }
.elevation-3 { box-shadow: var(--shadow-lg); }
.elevation-4 { box-shadow: var(--shadow-xl); }

/* Primary glow utilities */
.glow-primary { box-shadow: var(--shadow-primary-glow); }
.glow-primary-lg { box-shadow: var(--shadow-primary-glow-lg); }

/* Card elevated variant */
.card-elevated {
  background: var(--card-elevated);
  box-shadow: var(--shadow-lg);
}

## Step 4: Update Card Component

In components/ui/card.tsx, find the Card component's className.

CHANGE:
"shadow-sm" → "shadow-md"

The full className should now include "shadow-md" instead of "shadow-sm".

## Step 5: Verification Commands

```bash
npm run build
npm run test:run
```

Visual verification:
- Cards have visible depth/shadow
- Shadows are darker than before

## Step 6: Update Documentation

Add to docs/03-logs/research/ui-modernization-research.md:
- "Phase 2 Complete" section
- Shadow scale values documented
- Card component change noted

## Anti-Patterns (DO NOT DO)
- Do not add shadows to body or background
- Do not use Tailwind's default shadow values (use custom variables)
- Do not modify Card's structure, only shadow class

## Success Criteria
- npm run build passes
- npm run test:run passes (all 55 tests)
- Cards have visible shadows in browser
- Shadow variables defined in globals.css
```

### Checkpoint 2 ✅ COMPLETE (2026-02-02)
- [x] `npm run build` passes
- [x] `npm run test:run` passes (55 tests)
- [x] Shadow variables exist in globals.css
- [x] Card component uses shadow-md
- [x] Visual: cards have visible depth

---

# SEGMENT 3: Typography Enhancement

## Prompt for AI

```
You are implementing Phase 3 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-2 must be complete

## Your Task
Create stronger visual hierarchy through typography utility classes.

## Step 1: Read Current State

Read: app/globals.css

Note existing typography-related classes.

## Step 2: Add Typography Utility Classes

In app/globals.css, add these classes (in @layer utilities or after @layer base):

/* Typography scale */
.text-display {
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.text-headline {
  font-size: clamp(1.5rem, 3vw, 1.875rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.text-title {
  font-size: clamp(1.125rem, 2vw, 1.25rem);
  font-weight: 600;
  line-height: 1.3;
}

.text-body-lg {
  font-size: 1.125rem;
  line-height: 1.6;
}

/* Gradient text utility */
.text-gradient-primary {
  background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Subtle gradient for secondary emphasis */
.text-gradient-subtle {
  background: linear-gradient(135deg, oklch(0.9 0 0), oklch(0.7 0 0));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

## Step 3: Verification Commands

```bash
npm run build
```

## Step 4: Update Documentation

Add to docs/03-logs/research/ui-modernization-research.md:
- "Phase 3 Complete" section
- Typography scale documented

## Anti-Patterns (DO NOT DO)
- Do not modify existing h1-h6 base styles
- Do not use px values (use rem/clamp)
- Do not add these classes to any page files yet (that's Phase 8)

## Success Criteria
- npm run build passes
- Typography classes exist in globals.css
- No changes to page files
```

### Checkpoint 3 ✅ COMPLETE (2026-02-02)
- [x] `npm run build` passes
- [x] Typography classes exist in globals.css
- [x] .text-display, .text-headline, .text-title defined
- [x] .text-gradient-primary defined
- [x] Documentation updated

---

# SEGMENT 4: Card & Component Styling

## Prompt for AI

```
You are implementing Phase 4 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-3 must be complete

## Your Task
Add modern card variants with gradients and glass effects.

## Step 1: Query Documentation

Query shadcn/ui for card component patterns:
- Tool: mcp__plugin_context7_context7__query-docs
- libraryId: "/websites/ui_shadcn"
- query: "card component variants styling customization"

Also use the shadcn MCP to get card details:
- Tool: mcp__shadcn-ui__get_component
- component: "card"

## Step 2: Read Current Files

Read:
- app/globals.css
- components/ui/card.tsx

## Step 3: Add Card Variant Classes

In app/globals.css, add these card utility classes:

/* Glassmorphism card */
.card-glass {
  background: oklch(0.15 0.01 285 / 60%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid oklch(1 0 0 / 10%);
}

/* Gradient border card */
.card-gradient-border {
  position: relative;
  background: var(--card);
  border: none;
}

.card-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Enhanced hover lift (update existing) */
.card-hover-lift {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.card-hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Interactive card (combines hover + focus) */
.card-interactive {
  transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--card-elevated);
}

.card-interactive:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

## Step 4: Verification Commands

```bash
npm run build
npm run test:run
```

## Step 5: Update Documentation

Add to docs/03-logs/research/ui-modernization-research.md:
- "Phase 4 Complete" section
- Card variants documented

## Anti-Patterns (DO NOT DO)
- Do not modify the base Card component's default className
- Do not remove existing card-hover-lift class, enhance it
- Do not apply variants to pages yet (that's Phase 8)

## Success Criteria
- npm run build passes
- npm run test:run passes
- Card variant classes exist in globals.css
- .card-glass, .card-gradient-border, .card-interactive defined
```

### Checkpoint 4 ✅ COMPLETE (2026-02-02)
- [x] `npm run build` passes
- [x] `npm run test:run` passes
- [x] .card-glass class exists
- [x] .card-gradient-border class exists
- [x] .card-interactive class exists
- [x] Documentation updated

---

# SEGMENT 5: Navigation & Layout Polish

## Prompt for AI

```
You are implementing Phase 5 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-4 must be complete

## Your Task
Enhance navigation with modern styling.

## Step 1: Read Current Files

Read:
- components/layout/navbar.tsx
- components/layout/mobile-nav.tsx
- app/(app)/layout.tsx
- app/globals.css

## Step 2: Add Navigation Utility Classes

In app/globals.css, add:

/* Navbar gradient accent */
.navbar-gradient-border {
  position: relative;
}

.navbar-gradient-border::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--primary-gradient-start) 20%,
    var(--primary-gradient-end) 80%,
    transparent 100%
  );
}

/* Mobile nav active indicator */
.nav-item-active {
  position: relative;
}

.nav-item-active::after {
  content: '';
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary);
}

/* Subtle background gradient for pages */
.bg-gradient-subtle {
  background: linear-gradient(
    180deg,
    var(--background) 0%,
    oklch(0.10 0.01 285) 100%
  );
}

## Step 3: Update Navbar Component

In components/layout/navbar.tsx, find the <header> element.

ADD the class "navbar-gradient-border" to the existing className.

Example change:
BEFORE: className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur"
AFTER: className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur navbar-gradient-border"

## Step 4: Update Mobile Nav Active State

In components/layout/mobile-nav.tsx, find where the active state is determined.

The existing code likely uses a small dot indicator. Enhance it by:
- Adding "nav-item-active" class to active nav items
- Or updating the existing indicator styling

Look for the active indicator element (likely has bg-primary class) and add glow effect:
className="... shadow-[0_0_8px_var(--primary)]"

## Step 5: Verification Commands

```bash
npm run build
npm run test:run
```

Visual verification:
- Navbar has subtle gradient line at bottom
- Mobile nav active indicator has glow
- Test responsive: resize browser to mobile width

## Step 6: Update Documentation

Add to docs/03-logs/research/ui-modernization-research.md:
- "Phase 5 Complete" section
- Navigation changes documented

## Anti-Patterns (DO NOT DO)
- Do not change navigation structure or routes
- Do not remove existing backdrop-blur
- Do not break mobile responsiveness

## Success Criteria
- npm run build passes
- npm run test:run passes
- Navbar has gradient accent line
- Mobile nav active state enhanced
```

### Checkpoint 5 ✅ COMPLETE (2026-02-02)
- [x] `npm run build` passes
- [x] `npm run test:run` passes
- [x] Navbar has navbar-gradient-border class
- [x] Navigation utility classes exist in globals.css
- [x] Visual: gradient line visible on navbar

---

# SEGMENT 6: Empty States & Loading Enhancement

## Prompt for AI

```
You are implementing Phase 6 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-5 must be complete

## Your Task
Create engaging empty states and enhance loading animations.

## Step 1: Read Current Files

Read:
- components/ui/skeleton.tsx
- app/globals.css (look for existing .skeleton-shimmer)
- app/(app)/dashboard/page.tsx (look for empty state)

## Step 2: Enhance Skeleton Component

In app/globals.css, update or add the skeleton shimmer class:

/* Modern skeleton shimmer */
.skeleton-modern {
  position: relative;
  overflow: hidden;
  background: var(--surface-1);
}

.skeleton-modern::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--surface-3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton-modern::after {
    animation: none;
    background: var(--surface-2);
  }
}

## Step 3: Add Empty State Utilities

In app/globals.css, add:

/* Empty state container */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

/* Empty state icon wrapper with gradient background */
.empty-state-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: linear-gradient(135deg,
    oklch(0.585 0.233 288 / 20%),
    oklch(0.75 0.15 195 / 20%)
  );
  margin-bottom: 1.5rem;
}

/* Decorative ring animation */
.empty-state-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid oklch(0.585 0.233 288 / 30%);
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .empty-state-ring {
    animation: none;
    opacity: 0.3;
  }
}

## Step 4: Update Skeleton Component

In components/ui/skeleton.tsx, consider adding the modern variant.

Option A (minimal change): Keep current component, use .skeleton-modern class manually
Option B (enhance component): Add variant prop

For Option A (RECOMMENDED - less disruptive):
- No changes to skeleton.tsx needed
- Use className="skeleton-modern rounded-md h-4 w-full" in loading.tsx files

## Step 5: Verification Commands

```bash
npm run build
npm run test:run
```

## Step 6: Update Documentation

Add to docs/03-logs/research/ui-modernization-research.md:
- "Phase 6 Complete" section
- Empty state and loading patterns documented

## Anti-Patterns (DO NOT DO)
- Do not remove existing skeleton component functionality
- Do not forget prefers-reduced-motion media queries
- Do not modify page files yet (that's Phase 8)

## Success Criteria
- npm run build passes
- npm run test:run passes
- .skeleton-modern class exists with shimmer animation
- .empty-state utilities exist
- Accessibility: reduced-motion respected
```

### Checkpoint 6
- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] .skeleton-modern class exists
- [ ] .empty-state classes exist
- [ ] @keyframes shimmer defined
- [ ] prefers-reduced-motion media queries included

---

# SEGMENT 7: Microinteractions & Polish

## Prompt for AI

```
You are implementing Phase 7 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-6 must be complete

## Your Task
Add subtle animations for premium feel.

## Step 1: Read Current State

Read: app/globals.css

Note existing animations (button press, card-hover-lift, etc.)

## Step 2: Add Animation Utilities

In app/globals.css, add:

/* Stagger animation for lists */
@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-item {
  opacity: 0;
  animation: stagger-in 0.3s ease-out forwards;
}

/* Stagger delays via CSS custom property */
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
.stagger-item:nth-child(5) { animation-delay: 200ms; }
.stagger-item:nth-child(6) { animation-delay: 250ms; }
.stagger-item:nth-child(7) { animation-delay: 300ms; }
.stagger-item:nth-child(8) { animation-delay: 350ms; }
.stagger-item:nth-child(n+9) { animation-delay: 400ms; }

/* Button gradient animation */
.btn-gradient {
  background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
  background-size: 200% 200%;
  transition: background-position 0.3s ease;
}

.btn-gradient:hover {
  background-position: 100% 100%;
}

/* Scale in animation */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}

/* Enhanced focus ring */
.focus-ring-enhanced {
  transition: box-shadow 0.15s ease, outline 0.15s ease;
}

.focus-ring-enhanced:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px oklch(0.585 0.233 288 / 20%);
}

/* Smooth color transitions for all interactive elements */
.transition-colors-smooth {
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

/* Respect reduced motion for ALL animations */
@media (prefers-reduced-motion: reduce) {
  .stagger-item {
    animation: none;
    opacity: 1;
  }

  .btn-gradient {
    transition: none;
  }

  .animate-scale-in {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

## Step 3: Verification Commands

```bash
npm run build
npm run test:run
```

## Step 4: Update Documentation

Add to docs/03-logs/research/ui-modernization-research.md:
- "Phase 7 Complete" section
- Animation utilities documented
- Accessibility notes for reduced-motion

## Anti-Patterns (DO NOT DO)
- Do not create animations longer than 0.4s
- Do not forget prefers-reduced-motion
- Do not use transform: translateZ for simple animations (causes repaints)
- Do not add animations to every element (be subtle)

## Success Criteria
- npm run build passes
- npm run test:run passes
- Stagger animation defined
- Button gradient animation defined
- All animations respect prefers-reduced-motion
```

### Checkpoint 7
- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] @keyframes stagger-in defined
- [ ] .btn-gradient class exists
- [ ] .animate-scale-in class exists
- [ ] All animations have reduced-motion fallbacks

---

# SEGMENT 8: Full Page Overhaul (Part 1 - Core Pages)

## Prompt for AI

```
You are implementing Phase 8, Part 1 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-7 must be complete
- All utility classes from previous phases available

## Your Task
Apply new design system to CORE pages (dashboard, login, create-band).

## Step 1: Read Documentation

Read:
- docs/03-logs/research/ui-modernization-research.md (your design tokens)
- The source plan for page-specific guidance

## Step 2: Update Dashboard Page

Read: app/(app)/dashboard/page.tsx

Apply these changes:
1. Page title: Add "text-headline" class
2. Band cards: Add "card-interactive" class
3. Empty state: Use "empty-state" + "empty-state-icon" structure
4. Card grid: Add "stagger-item" class to each card

Example title change:
BEFORE: <h1 className="text-2xl font-bold">Dashboard</h1>
AFTER: <h1 className="text-headline">Dashboard</h1>

Example card change:
BEFORE: <Card className="...">
AFTER: <Card className="card-interactive ...">

## Step 3: Update Login Page

Read: app/login/page.tsx

Apply these changes:
1. Container: Add subtle gradient background if appropriate
2. Login button: Consider "btn-gradient" for CTA
3. Card: Add "shadow-lg" for elevation

## Step 4: Update Create Band Page

Read: app/(app)/create-band/page.tsx

Apply these changes:
1. Page title: Add "text-headline" class
2. Form inputs: Ensure focus-ring-enhanced behavior
3. Submit button: Add "btn-gradient" class

## Step 5: Verification Commands

```bash
npm run build
npm run test:run
npm run dev
```

Visual verification:
- Visit /dashboard - cards should have hover effects
- Visit /login - should have elevated card
- Visit /create-band - title should be larger

## Step 6: Create Progress Log

Create/update: docs/03-logs/implementation-logs/implementation-log-ui-modernization.md

Add:
- Phase 8 Part 1 status
- Pages modified
- Classes applied to each page

## Anti-Patterns (DO NOT DO)
- Do not remove existing functionality
- Do not change component props/logic
- Do not add new dependencies
- Do not modify server actions

## Success Criteria
- npm run build passes
- npm run test:run passes
- Dashboard has card hover effects
- Login has elevated card styling
- Create band has gradient button
```

### Checkpoint 8.1
- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] Dashboard page updated with new classes
- [ ] Login page updated
- [ ] Create band page updated
- [ ] Implementation log created

---

# SEGMENT 9: Full Page Overhaul (Part 2 - Band Pages)

## Prompt for AI

```
You are implementing Phase 8, Part 2 of the BandHub UI Modernization project.

## Prerequisites
- SEGMENTS 0-8.1 must be complete

## Your Task
Apply new design system to ALL BAND PAGES (17 pages total).

## Step 1: Read Documentation

Read:
- docs/03-logs/research/ui-modernization-research.md
- docs/03-logs/implementation-logs/implementation-log-ui-modernization.md

## Step 2: Page Update Checklist

For EACH page below, apply consistent changes:

**Band Home & Members:**
- [ ] app/(app)/band/[id]/page.tsx - Navigation cards with card-interactive
- [ ] app/(app)/band/[id]/members/page.tsx - Member list with stagger-item

**Events & Calendar:**
- [ ] app/(app)/band/[id]/calendar/page.tsx - Event cards styled
- [ ] app/(app)/band/[id]/events/new/page.tsx - Form with btn-gradient submit
- [ ] app/(app)/band/[id]/events/[eventId]/page.tsx - RSVP buttons styled

**Communication:**
- [ ] app/(app)/band/[id]/announcements/page.tsx - Announcement cards
- [ ] app/(app)/band/[id]/chat/page.tsx - Message styling (be careful with realtime)
- [ ] app/(app)/band/[id]/threads/page.tsx - Thread list with hover
- [ ] app/(app)/band/[id]/threads/[threadId]/page.tsx - Message bubbles

**Availability & Files:**
- [ ] app/(app)/band/[id]/availability/page.tsx - Poll cards
- [ ] app/(app)/band/[id]/availability/new/page.tsx - Time slot picker
- [ ] app/(app)/band/[id]/availability/[pollId]/page.tsx - Voting UI
- [ ] app/(app)/band/[id]/files/page.tsx - File grid styling

**Invitations:**
- [ ] app/(app)/invitations/page.tsx - Invitation cards with hover

**Standard changes for ALL pages:**
1. Page titles → "text-headline" class
2. Section titles → "text-title" class
3. Interactive cards → "card-interactive" class
4. Lists → "stagger-item" on children
5. Primary CTAs → "btn-gradient" class

## Step 3: Apply Changes Systematically

Read each file, identify elements, apply classes. Example pattern:

For a page with a card list:
1. Find the page title h1/h2 → add text-headline
2. Find Card components → add card-interactive if clickable
3. Find list items → add stagger-item
4. Find primary buttons → add btn-gradient

## Step 4: Verification Commands

After EACH file modification:
```bash
npm run build
```

After ALL files:
```bash
npm run test:run
npm run dev
```

Test each page in browser:
- Card hover effects work
- Stagger animations appear
- No visual regressions

## Step 5: Update Implementation Log

Update: docs/03-logs/implementation-logs/implementation-log-ui-modernization.md

List each page and what was changed.

## Anti-Patterns (DO NOT DO)
- Do not modify realtime/state logic in chat page
- Do not change form submission handlers
- Do not remove accessibility attributes
- Do not add classes that conflict with responsive design

## Success Criteria
- npm run build passes
- npm run test:run passes (all 55 tests)
- All 17 band pages updated
- Visual consistency across pages
- Mobile viewport still works
```

### Checkpoint 9
- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] All 17 band pages updated
- [ ] Implementation log updated with all changes
- [ ] Visual verification on mobile viewport

---

# SEGMENT 10: Final Integration, Testing & Documentation

## Prompt for AI

```
You are implementing the FINAL PHASE of the BandHub UI Modernization project.

## Prerequisites
- ALL SEGMENTS 0-9 must be complete

## Your Task
Verify all changes, run full test suite, and complete documentation.

## Step 1: Full Test Suite

Run these commands and document results:

```bash
# Unit tests
npm run test:run

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

ALL must pass. If any fail, fix before proceeding.

## Step 2: Visual Verification Checklist

Start dev server: npm run dev

Test EACH viewport:
- [ ] 320px (small mobile)
- [ ] 375px (iPhone)
- [ ] 768px (tablet)
- [ ] 1024px (laptop)
- [ ] 1440px (desktop)

Test EACH page type:
- [ ] Login page - elevated card, styled button
- [ ] Dashboard - card hover, stagger animation
- [ ] Band home - navigation cards work
- [ ] Calendar - events styled
- [ ] Chat - messages render correctly
- [ ] Files - grid/list styling

## Step 3: Accessibility Audit

Verify:
- [ ] Focus rings visible (Tab through interface)
- [ ] Keyboard navigation works
- [ ] Color contrast adequate (cards vs background)
- [ ] Animations respect prefers-reduced-motion

## Step 4: Update CLAUDE.md

Read: CLAUDE.md

Add a new section documenting the design system:

## Design System (Post-Modernization)

| Token Type | Example Values |
|------------|----------------|
| Colors | --background, --card, --card-elevated, --surface-1/2/3 |
| Shadows | --shadow-xs/sm/md/lg/xl, --shadow-primary-glow |
| Typography | .text-display, .text-headline, .text-title |
| Cards | .card-interactive, .card-glass, .card-gradient-border |
| Animations | .stagger-item, .btn-gradient, .animate-scale-in |

Add to Commands section:
```bash
npm run test:run    # 55 unit tests
npm run test:e2e    # E2E tests
```

## Step 5: Complete Implementation Log

Finalize: docs/03-logs/implementation-logs/implementation-log-ui-modernization.md

Add:
- Final summary of all changes
- Files modified count
- Test results
- Known issues (if any)
- Recommendations for future work

## Step 6: Code Review Preparation

Run the code-review skill:
/code-review UI modernization changes

Or use the quality-assurance agent for final review.

## Step 7: Final Verification

Use the verification-before-completion skill:
/verification-before-completion UI modernization project

Ensure:
- All tests pass
- No console errors in browser
- No TypeScript errors
- Build succeeds

## Anti-Patterns (DO NOT DO)
- Do not skip any verification step
- Do not mark complete if tests fail
- Do not forget to update CLAUDE.md
- Do not leave undocumented changes

## Success Criteria
- npm run test:run passes (55 tests)
- npm run build succeeds
- npm run lint passes
- All documentation updated
- CLAUDE.md has design system section
- Implementation log complete
```

### Checkpoint 10 (FINAL)
- [ ] `npm run test:run` passes (55 tests)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] CLAUDE.md updated with design system
- [ ] Implementation log complete
- [ ] Code review passed
- [ ] All pages visually verified
- [ ] Accessibility verified

---

# Summary: Execution Order

| Segment | Focus | Key Files | Checkpoint |
|---------|-------|-----------|------------|
| 0 | Documentation Discovery | docs/research/* | Research log created |
| 1 | Color System | globals.css | Higher contrast colors |
| 2 | Shadow System | globals.css, card.tsx | Cards have depth |
| 3 | Typography | globals.css | Text scale classes |
| 4 | Card Variants | globals.css | Glass, gradient borders |
| 5 | Navigation | navbar.tsx, mobile-nav.tsx | Gradient accents |
| 6 | Empty/Loading States | globals.css | Shimmer, empty states |
| 7 | Microinteractions | globals.css | Stagger, transitions |
| 8 | Core Pages | dashboard, login, create-band | Cards interactive |
| 9 | Band Pages | 17 band routes | All pages styled |
| 10 | Final Testing | All files | Tests pass, docs complete |

---

# MCP Tools Reference

Use these tools throughout execution:

**Documentation:**
- `mcp__plugin_context7_context7__resolve-library-id` - Find library IDs
- `mcp__plugin_context7_context7__query-docs` - Query documentation

**shadcn/ui:**
- `mcp__shadcn-ui__list_components` - List all components
- `mcp__shadcn-ui__get_component` - Get component code
- `mcp__shadcn-ui__get_component_demo` - Get demo code

**Testing (if needed):**
- `mcp__playwright__browser_navigate` - Visual testing
- `mcp__playwright__browser_snapshot` - Capture state

---

# Anti-Patterns Summary

1. **Do NOT** invent APIs without documentation
2. **Do NOT** skip verification commands
3. **Do NOT** modify server actions or state logic
4. **Do NOT** use hex colors (maintain oklch)
5. **Do NOT** forget prefers-reduced-motion
6. **Do NOT** mark segments complete without tests passing
7. **Do NOT** change component structure, only classes
8. **Do NOT** remove existing functionality

---

# Documentation Files to Create/Update

| File | When | Content |
|------|------|---------|
| docs/03-logs/research/ui-modernization-research.md | Segment 0 | Research findings, color tokens |
| docs/03-logs/implementation-logs/implementation-log-ui-modernization.md | Segment 8+ | Change log per page |
| CLAUDE.md | Segment 10 | Design system section |

---

*Plan generated: 2026-02-02*
*Source: noble-frolicking-cupcake.md*
*Execution: Sequential with checkpoints*
