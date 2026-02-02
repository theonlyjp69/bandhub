# Stage 9: Deploy

> **References:** [CLAUDE.md](../CLAUDE.md) | [docs/](../docs/README.md) | [MASTER-PLAN.md](./MASTER-PLAN.md)

## Context

You are building **BandHub**. The app is polished (Stage 8). Now you deploy to production.

**Prerequisites:** Stage 8 complete, app looks good and works well.

**Research References:**
- [GitHub Resources](docs/03-logs/research/github-resources.md) - Vercel deployment patterns
- [Research Synthesis](docs/03-logs/research/research-synthesis.md) - Approved tech stack decisions

---

## Your Goal

1. Final security audit
2. Deploy to Vercel
3. Configure production environment
4. Verify everything works in production

---

## Tools Available

| Tool | Purpose |
|------|---------|
| `vercel` MCP | Create project, deploy, manage env vars |
| `supabase` MCP | Configure production auth URLs |
| `playwright` MCP | Production E2E tests |

## Agents Available

| Agent | Purpose |
|-------|---------|
| `code-developer` | Fix any issues |
| `quality-assurance` | Final review |

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/security` | Security audit |
| `/review` | Code review |
| `/ship` | Pre-deployment checklist |
| `/verification-before-completion` | Final verification |

---

## Task 9.1: Pre-Deployment Security Audit

**Use:** `/security` skill

Check for:
- [ ] No secrets in code
- [ ] `.env.local` is gitignored
- [ ] RLS policies on all tables
- [ ] Auth middleware protecting routes
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] HTTPS enforced

**Use:** `quality-assurance` agent for full audit

---

## Task 9.2: Pre-Deployment Code Review

**Use:** `/review` skill

Check for:
- [ ] No console.logs in production code
- [ ] No TODO comments left
- [ ] Error handling in place
- [ ] TypeScript has no errors
- [ ] Build succeeds: `npm run build`

---

## Task 9.3: Create Vercel Project

**Use:** `vercel` MCP → `create_project`

```
Project name: bandhub
Framework: Next.js
```

---

## Task 9.4: Configure Environment Variables

**Use:** `vercel` MCP → `add_env`

Add these environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
```

**Important:** Use production Supabase project, not development.

---

## Task 9.5: Update Supabase Auth URLs

In Supabase Dashboard → Authentication → URL Configuration:

Add production URLs:
- Site URL: `https://bandhub.vercel.app` (or your domain)
- Redirect URLs: `https://bandhub.vercel.app/auth/callback`

Update Google OAuth:
- Add production redirect URI to Google Cloud Console

---

## Task 9.6: Deploy

**Use:** `vercel` MCP → `create_deployment`

Or via CLI:
```bash
npx vercel --prod
```

Wait for deployment to complete.

---

## Task 9.7: Production Verification

**Test in production:**

1. Visit production URL
2. Sign in with Google
3. Create a band
4. Invite a member (use different email)
5. Create an event
6. RSVP to event
7. Send chat message
8. Verify real-time works

**Use:** `playwright` MCP to run E2E tests against production URL

```typescript
// Update playwright config
const config = {
  use: {
    baseURL: process.env.PRODUCTION_URL || 'https://bandhub.vercel.app',
  },
}
```

---

## Task 9.8: Custom Domain (Optional)

**Use:** `vercel` MCP → `add_domain`

If you have a custom domain:
1. Add domain in Vercel
2. Update DNS records
3. Update Supabase auth URLs
4. Update Google OAuth redirect URIs

---

## Task 9.9: Set Up Monitoring (Optional)

Consider adding:
- Vercel Analytics (built-in)
- Error tracking (Sentry)
- Uptime monitoring

---

## Final Checkpoint: Production Ready

```
✓ Security audit passed
✓ Code review passed
✓ Build succeeds
✓ Deployed to Vercel
✓ Environment variables set
✓ Auth URLs configured for production
✓ Google OAuth works in production
✓ All features work in production
✓ Real-time messaging works in production
✓ Mobile responsive in production
```

**Use:** `/ship` skill for final checklist

---

## Post-Launch Tasks

After successful deployment:

1. **Monitor:** Watch for errors in Vercel logs
2. **Test with real users:** Have band members try it
3. **Gather feedback:** Note issues and improvements
4. **Plan v2:** Review deferred features from research

---

## Congratulations!

BandHub is now live!

**What you built:**
- Band management with invitations
- Event calendar with RSVPs
- Availability polling (When2Meet-style)
- File storage for setlists, recordings, etc.
- Real-time group chat
- Discussion threads
- Announcements

**What's next (future stages):**
- Finance tracking
- Setlist builder
- Direct messages (1:1)
- Push notifications
- Mobile app

---

## Reference: Production URLs

| Service | URL |
|---------|-----|
| App | https://bandhub.vercel.app |
| Supabase | https://[project].supabase.co |
| Vercel Dashboard | https://vercel.com/[username]/bandhub |

**Commit:** "Deploy to production"
