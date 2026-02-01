# Stage 1: Project Foundation & Database

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are building **BandHub**. Research is complete (Stage 0). Now you set up the project and create all database tables.

**Prerequisites:** Stage 0 complete, user approved research synthesis.

**Research References:**
- [GitHub Resources](C:\Users\jpcoo\docs\research\github-resources.md) - Tech stack and packages
- [Research Synthesis](C:\Users\jpcoo\docs\research\research-synthesis.md) - Approved decisions

---

## Your Goal

1. Create the Next.js project
2. Set up Supabase (database + storage)
3. Create all database tables with RLS policies
4. Set up Supabase Storage for file uploads
5. Generate TypeScript types

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `Bash` | Run terminal commands |
| `supabase` MCP | Create project, run migrations, execute SQL |
| `shadcn-ui` MCP | Initialize UI components |
| `context7` MCP | Look up Next.js/Supabase docs |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Write code, create files |
| `system-architect` | Design schema, review structure |
| `quality-assurance` | Review security, code quality |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/review` | Code review |
| `/security` | Security audit |
| `/git-commit` | Commit changes |

---

## Task 1.1: Create Next.js Project

**Run:**
```bash
npx create-next-app@latest bandhub --typescript --tailwind --app --src-dir=false
cd bandhub
git init
```

**Install additional dependencies:**
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install react-big-calendar date-fns
npm install @types/react-big-calendar --save-dev
```

**Test:** Run `npm run dev` - should start without errors

**Commit:** "Initial Next.js project setup"

---

## Task 1.2: Set Up Supabase

**Use:** `supabase` MCP

1. Create Supabase project: `create_project`
2. Get project URL and keys: `get_project`, `get_publishable_keys`
3. Create `.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

**Test:** Console log connection to verify it works

**Security check:** Ensure `.env.local` is in `.gitignore`

---

## Checkpoint 1.1: Project Foundation

```
✓ Next.js project runs with npm run dev
✓ Supabase project created
✓ Environment variables configured
✓ .env.local is gitignored
✓ Initial commit made
```

---

## Task 1.3: Create Profiles Table

**Use:** `supabase` MCP → `apply_migration`

```sql
-- Migration: create_profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Test:**
- Insert test profile in Supabase dashboard
- Verify RLS blocks unauthorized updates

---

## Task 1.4: Create Bands Table

**Use:** `supabase` MCP → `apply_migration`

```sql
-- Migration: create_bands
CREATE TABLE bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
```

---

## Task 1.5: Create Band Members Table

**Use:** `supabase` MCP → `apply_migration`

```sql
-- Migration: create_band_members
CREATE TABLE band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(band_id, user_id)
);

ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;

-- Users can only see bands they're members of
CREATE POLICY "Members can view band members"
  ON band_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM band_members WHERE band_id = band_members.band_id
    )
  );

-- Add RLS to bands table
CREATE POLICY "Members can view their bands"
  ON bands FOR SELECT
  USING (
    id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create bands"
  ON bands FOR INSERT
  WITH CHECK (auth.uid() = created_by);
```

**Test:**
- Create band in dashboard
- Add member
- Verify non-members can't see the band

---

## Task 1.6: Create Invitations Table

```sql
-- Migration: create_invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = invitations.band_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view invitations sent to their email"
  ON invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );
```

---

## Checkpoint 1.2: Core Schema

```
✓ profiles table with RLS
✓ bands table with RLS
✓ band_members table with RLS
✓ invitations table with RLS
✓ Foreign keys working
✓ Manual CRUD tests pass in Supabase dashboard
```

**Use:** `/security` skill to audit RLS policies

---

## Task 1.7: Create Events Table

```sql
-- Migration: create_events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('show', 'rehearsal', 'deadline', 'other')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view events"
  ON events FOR SELECT
  USING (
    band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Band members can create events"
  ON events FOR INSERT
  WITH CHECK (
    band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid())
  );
```

---

## Task 1.8: Create Event RSVPs Table

```sql
-- Migration: create_event_rsvps
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('going', 'maybe', 'not_going')),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view RSVPs"
  ON event_rsvps FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE band_id IN (
        SELECT band_id FROM band_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR ALL
  USING (user_id = auth.uid());
```

---

## Task 1.9: Create Communication Tables

```sql
-- Migration: create_communication
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add policies (band members only)
CREATE POLICY "Band members can view announcements"
  ON announcements FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM band_members WHERE band_id = announcements.band_id AND user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Band members can view threads"
  ON threads FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can create threads"
  ON threads FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can view messages"
  ON messages FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can send messages"
  ON messages FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));
```

---

## Task 1.10: Create Availability Polling Tables *(New - from research)*

See [Event Management Patterns](C:\Users\jpcoo\docs\research\event-management-patterns.md) for When2Meet-style polling research.

```sql
-- Migration: create_availability_polling
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

CREATE TABLE availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES availability_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  available_slots JSONB NOT NULL,  -- Array of selected slot indices
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE availability_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view polls"
  ON availability_polls FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can create polls"
  ON availability_polls FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can view responses"
  ON availability_responses FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM availability_polls WHERE band_id IN (
        SELECT band_id FROM band_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own responses"
  ON availability_responses FOR ALL
  USING (user_id = auth.uid());
```

---

## Task 1.11: Create Files Table and Storage *(New - from research)*

See [GitHub Resources](C:\Users\jpcoo\docs\research\github-resources.md) for Supabase Storage setup.

```sql
-- Migration: create_files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,  -- Supabase Storage path
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can view files"
  ON files FOR SELECT
  USING (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Band members can upload files"
  ON files FOR INSERT
  WITH CHECK (band_id IN (SELECT band_id FROM band_members WHERE user_id = auth.uid()));

CREATE POLICY "Uploaders can delete own files"
  ON files FOR DELETE
  USING (uploaded_by = auth.uid());
```

**Set up Supabase Storage bucket:**

In Supabase Dashboard → Storage:
1. Create bucket named `band-files`
2. Set to private (not public)
3. Add RLS policies for storage:

```sql
-- Storage policies (run in SQL editor)
CREATE POLICY "Band members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'band-files' AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Band members can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'band-files' AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Uploaders can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'band-files' AND
    auth.uid() = owner
  );
```

---

## Checkpoint 1.3: Complete Schema

```
✓ All 12 tables created:
  - profiles
  - bands
  - band_members
  - invitations
  - events
  - event_rsvps
  - announcements
  - threads
  - messages
  - availability_polls
  - availability_responses
  - files
✓ All RLS policies in place
✓ Foreign keys verified
✓ Storage bucket created with RLS
✓ Manual CRUD tests pass
✓ Security audit passed
```

**Use:** `quality-assurance` agent for full schema review

---

## Task 1.12: Generate TypeScript Types

**Use:** `supabase` MCP → `generate_typescript_types`

Save to: `types/database.ts`

**Test:** TypeScript compiles without errors

---

## Task 1.13: Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Create `lib/supabase/client.ts` and `lib/supabase/server.ts`

---

## Final Checkpoint: Stage 1 Complete

```
✓ Next.js project running
✓ Supabase connected
✓ All 12 tables created (including availability_polls, availability_responses, files)
✓ Storage bucket configured
✓ All RLS policies working
✓ TypeScript types generated
✓ Supabase client libraries installed
✓ All migrations committed to git
```

**Commit:** "Complete database schema with RLS"

**Next Stage:** [STAGE-2-AUTH.md](./STAGE-2-AUTH.md)
