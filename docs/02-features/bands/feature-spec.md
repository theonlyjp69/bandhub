# Band Management Feature Specification

## Overview

Band management is the core organizational feature of BandHub. Users can create bands, invite members via email, and manage membership with role-based permissions.

## User Stories

### US-BAND-1: Create Band
**As a** user
**I want to** create a new band
**So that** I can coordinate with my bandmates

**Acceptance Criteria:**
- Form with name (required) and description (optional)
- Creator automatically becomes admin
- Redirect to band page after creation

### US-BAND-2: View My Bands
**As a** user
**I want to** see all bands I'm a member of
**So that** I can navigate between them

**Acceptance Criteria:**
- Dashboard shows list of user's bands
- Each band shows name and member count
- Click band to navigate to band page

### US-BAND-3: Invite Members
**As a** band admin
**I want to** invite new members via email
**So that** I can grow my band

**Acceptance Criteria:**
- Email input field for invite
- Invitation created with pending status
- Only admins can invite

### US-BAND-4: Accept/Decline Invitation
**As a** user
**I want to** respond to band invitations
**So that** I can join bands

**Acceptance Criteria:**
- Invitations page shows pending invites
- Accept adds user to band as member
- Decline updates status without joining

### US-BAND-5: Manage Members
**As a** band admin
**I want to** manage band membership
**So that** I can control who has access

**Acceptance Criteria:**
- View all members with roles
- Change member roles (admin/member)
- Remove members from band
- Only admins see management controls

## Data Model

### bands table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Band name (required) |
| description | TEXT | Band description |
| created_by | UUID | References profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |

### band_members table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| user_id | UUID | References profiles |
| role | TEXT | 'admin' or 'member' |
| joined_at | TIMESTAMPTZ | Join timestamp |

### invitations table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| email | TEXT | Invitee email |
| invited_by | UUID | References profiles |
| status | TEXT | 'pending', 'accepted', 'declined' |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Security

### RLS Policies

**bands:**
- Members can view their bands
- Authenticated users can create bands (as creator)

**band_members:**
- Members can view band members

**invitations:**
- Admins can create invitations
- Users can view invitations sent to their email

## Roles & Permissions

| Action | Admin | Member |
|--------|-------|--------|
| View band | Yes | Yes |
| Create events | Yes | Yes |
| Invite members | Yes | No |
| Change roles | Yes | No |
| Remove members | Yes | No |
| Delete band | Yes | No |

## UI Components

### Dashboard (`/dashboard`)
- Band cards grid
- "Create New Band" button
- Pending invitations badge

### Create Band (`/create-band`)
- Name input
- Description textarea
- Submit button

### Invitations (`/invitations`)
- List of pending invitations
- Band name and inviter
- Accept/Decline buttons

### Members (`/band/[id]/members`)
- Member list with avatars
- Role badges
- Invite form (admin only)
- Role/remove actions (admin only)

---

*Implementation: [plans/STAGE-3-BANDS.md](../../../plans/STAGE-3-BANDS.md)*
