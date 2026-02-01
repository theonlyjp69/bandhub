# Authentication Feature Specification

## Overview

BandHub uses Google OAuth for authentication via Supabase Auth. Users sign in with their Google accounts, and profiles are automatically created on first sign-in.

## User Stories

### US-AUTH-1: Sign In
**As a** user
**I want to** sign in with my Google account
**So that** I can access my bands and data

**Acceptance Criteria:**
- Google OAuth button on login page
- Successful auth redirects to dashboard
- Failed auth shows error message

### US-AUTH-2: Auto Profile Creation
**As a** new user
**I want** my profile to be created automatically
**So that** I don't have to fill out forms

**Acceptance Criteria:**
- Profile created in database on first sign-in
- Display name populated from Google (full_name)
- Avatar URL populated from Google

### US-AUTH-3: Protected Routes
**As a** user
**I want** my data protected from unauthorized access
**So that** only I can access my bands

**Acceptance Criteria:**
- /dashboard and /band/* routes require auth
- Unauthenticated users redirected to /login
- Auth state persists across page refreshes

### US-AUTH-4: Sign Out
**As a** user
**I want to** sign out of my account
**So that** I can secure my session

**Acceptance Criteria:**
- Sign out button in navigation
- Session cleared on sign out
- Redirected to login page

## Data Model

### profiles table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| display_name | TEXT | User's display name |
| avatar_url | TEXT | URL to avatar image |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Security

### RLS Policies
- Users can view any profile
- Users can only update their own profile

### Middleware
- Protects `/dashboard/:path*` and `/band/:path*`
- Refreshes session on each request
- Redirects to /login if not authenticated

## UI Components

### Login Page (`/login`)
- Centered card layout
- BandHub branding
- "Sign in with Google" button
- Tagline: "Your band's home base"

### Layout (`/(app)/layout.tsx`)
- User avatar in top right
- Dropdown menu with settings and sign out
- Navigation sidebar on desktop

---

*Implementation: [plans/STAGE-2-AUTH.md](../../../plans/STAGE-2-AUTH.md)*
