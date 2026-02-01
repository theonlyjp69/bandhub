# Definition of Done

Clear criteria for when work is considered complete at different levels.

---

## Task Done

A task is done when:

- [ ] **Implemented:** Code written and working
- [ ] **Tested:** Manual verification completed
- [ ] **Typed:** No TypeScript errors
- [ ] **Documented:** Comments where needed
- [ ] **Committed:** Changes committed to git

---

## Feature Done

A feature is done when:

- [ ] **All Tasks Complete:** Every sub-task done
- [ ] **Spec Satisfied:** All acceptance criteria met
- [ ] **Security:** RLS policies in place (if applicable)
- [ ] **Error Handling:** Graceful failure modes
- [ ] **Edge Cases:** Empty states, errors handled
- [ ] **Documented:** Feature spec complete

---

## Stage Done

A stage is done when:

- [ ] **All Features Complete:** Every task in stage done
- [ ] **Checkpoint Passed:** All criteria verified
- [ ] **Tests Passing:** Related tests green
- [ ] **Reviewed:** Code reviewed with `/review`
- [ ] **Logged:** Implementation log updated
- [ ] **Approved:** User approval received

---

## Sprint/Milestone Done

A milestone is done when:

- [ ] **All Stages Complete:** Backend or frontend done
- [ ] **Integration Tested:** Features work together
- [ ] **Performance OK:** No obvious slowness
- [ ] **Security Audited:** `/security` skill run
- [ ] **Documentation Updated:** All docs current

---

## MVP Done

The MVP is done when:

### Functional Requirements
- [ ] User can sign in with Google
- [ ] User can create a band and invite members
- [ ] Members can accept invites and join bands
- [ ] Anyone in a band can create events
- [ ] Members can RSVP to events
- [ ] Members can create availability polls
- [ ] Members can upload and share files
- [ ] Members can send real-time chat messages
- [ ] Members can create discussion threads
- [ ] Admins can post announcements

### Non-Functional Requirements
- [ ] App deployed to production
- [ ] App works on mobile browsers
- [ ] Dark theme implemented
- [ ] Real-time works (< 1s latency)
- [ ] No critical security issues

### Quality Requirements
- [ ] All E2E tests pass
- [ ] Security audit passed
- [ ] Production verification complete

---

## Quality Checklist

### Code Quality
- [ ] No console.log in production code
- [ ] No TODO comments left
- [ ] No unused imports/variables
- [ ] Consistent naming conventions
- [ ] Functions under 50 lines

### TypeScript
- [ ] No `any` types (except intentional)
- [ ] Interfaces for data shapes
- [ ] Types generated from database

### Security
- [ ] RLS on all tables
- [ ] No secrets in code
- [ ] Signed URLs for files
- [ ] Input validation
- [ ] HTTPS enforced

### Accessibility
- [ ] 44px touch targets
- [ ] Color contrast (WCAG AA)
- [ ] Keyboard navigation
- [ ] Screen reader labels

### Performance
- [ ] Page load < 3s
- [ ] No memory leaks
- [ ] Images optimized
- [ ] Code splitting

---

## Verification Commands

```bash
# TypeScript
npm run build

# Tests
npm run test
npx playwright test

# Lint (if configured)
npm run lint

# Type check
npx tsc --noEmit
```

---

## Acceptance Criteria Template

For each feature/task:

```markdown
**Given** [context]
**When** [action]
**Then** [expected result]

Example:
**Given** I am logged in
**When** I click "Create Band"
**Then** I see a form with name and description fields
```

---

*Update this document as standards evolve*
