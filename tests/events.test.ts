import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createUnauthenticatedClient, createTestBand, cleanupBand } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Events', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot view events', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('events')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([]) // RLS returns empty array
    })

    test('unauthenticated user cannot create events', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('events')
        .insert({
          band_id: 'fake-band-id',
          title: 'Unauthorized Event',
          event_type: 'show',
          start_time: new Date().toISOString(),
          created_by: 'fake-user-id'
        })
        .select()
        .single()

      expect(error).not.toBeNull()
      expect(data).toBeNull()
    })
  })

  describe('Event CRUD Operations', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null
    let testEventId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD) {
        return
      }
      const auth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      supabase = auth.supabase
      userId = auth.user.id

      // Create test band
      const band = await createTestBand(supabase, userId)
      testBandId = band.id
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create event with all fields', async () => {
      if (!testBandId) return

      const eventData = {
        band_id: testBandId,
        title: 'Big Show',
        event_type: 'show',
        start_time: '2024-06-01T20:00:00Z',
        end_time: '2024-06-01T23:00:00Z',
        location: 'The Venue',
        description: 'Our biggest show yet!',
        metadata: { venue: 'The Venue', pay: 500, set_length: 90 },
        created_by: userId
      }

      const { data: event, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(event).not.toBeNull()
      expect(event?.title).toBe('Big Show')
      expect(event?.event_type).toBe('show')
      expect(event?.location).toBe('The Venue')
      expect(event?.metadata).toMatchObject({ venue: 'The Venue', pay: 500 })

      testEventId = event?.id || null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('get event with details', async () => {
      if (!testEventId) return

      const { data: event, error } = await supabase
        .from('events')
        .select(`
          *,
          event_rsvps(user_id, status)
        `)
        .eq('id', testEventId)
        .single()

      expect(error).toBeNull()
      expect(event).not.toBeNull()
      expect(event?.id).toBe(testEventId)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('update event', async () => {
      if (!testEventId) return

      const { data: updated, error } = await supabase
        .from('events')
        .update({
          title: 'Updated Show Title',
          location: 'New Venue'
        })
        .eq('id', testEventId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated?.title).toBe('Updated Show Title')
      expect(updated?.location).toBe('New Venue')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('get band events', async () => {
      if (!testBandId) return

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('band_id', testBandId)
        .order('start_time', { ascending: true })

      expect(error).toBeNull()
      expect(events).not.toBeNull()
      expect(events!.length).toBeGreaterThan(0)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('delete event', async () => {
      if (!testEventId || !testBandId) return

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', testEventId)

      expect(error).toBeNull()

      // Verify deletion
      const { data: check } = await supabase
        .from('events')
        .select('id')
        .eq('id', testEventId)

      expect(check).toEqual([])
      testEventId = null
    })
  })

  describe('RSVP Operations', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null
    let testEventId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD) {
        return
      }
      const auth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      supabase = auth.supabase
      userId = auth.user.id

      // Create test band and event
      const band = await createTestBand(supabase, userId)
      testBandId = band.id

      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'RSVP Test Event',
          event_type: 'rehearsal',
          start_time: '2024-07-01T18:00:00Z',
          created_by: userId
        })
        .select()
        .single()

      testEventId = event?.id || null
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create RSVP', async () => {
      if (!testEventId) return

      const { data: rsvp, error } = await supabase
        .from('event_rsvps')
        .insert({
          event_id: testEventId,
          user_id: userId,
          status: 'going'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(rsvp).not.toBeNull()
      expect(rsvp?.status).toBe('going')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('RSVP upsert works (update existing)', async () => {
      if (!testEventId) return

      // Update to 'maybe' using upsert
      const { data: updated, error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: testEventId,
          user_id: userId,
          status: 'maybe'
        }, {
          onConflict: 'event_id,user_id'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated?.status).toBe('maybe')

      // Verify only one RSVP exists
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', testEventId)
        .eq('user_id', userId)

      expect(rsvps).toHaveLength(1)
      expect(rsvps![0].status).toBe('maybe')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('get event RSVPs', async () => {
      if (!testEventId) return

      const { data: rsvps, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          profiles(id, display_name, avatar_url)
        `)
        .eq('event_id', testEventId)

      expect(error).toBeNull()
      expect(rsvps).not.toBeNull()
      expect(rsvps!.length).toBeGreaterThan(0)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('delete RSVP', async () => {
      if (!testEventId) return

      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', testEventId)
        .eq('user_id', userId)

      expect(error).toBeNull()

      // Verify deletion
      const { data: check } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', testEventId)
        .eq('user_id', userId)

      expect(check).toEqual([])
    })
  })

  describe('Event Type Variations', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD) {
        return
      }
      const auth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      supabase = auth.supabase
      userId = auth.user.id

      const band = await createTestBand(supabase, userId)
      testBandId = band.id
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create rehearsal event', async () => {
      if (!testBandId) return

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Weekly Rehearsal',
          event_type: 'rehearsal',
          start_time: '2024-06-15T19:00:00Z',
          location: 'Practice Space',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(event?.event_type).toBe('rehearsal')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create deadline event', async () => {
      if (!testBandId) return

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Demo Submission Deadline',
          event_type: 'deadline',
          start_time: '2024-06-30T23:59:59Z',
          description: 'Submit demo to record label',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(event?.event_type).toBe('deadline')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create other event type', async () => {
      if (!testBandId) return

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Band Meeting',
          event_type: 'other',
          start_time: '2024-06-20T18:00:00Z',
          description: 'Discuss upcoming tour',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(event?.event_type).toBe('other')
    })
  })

  describe('Event Cascade Deletion', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD) {
        return
      }
      const auth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      supabase = auth.supabase
      userId = auth.user.id

      const band = await createTestBand(supabase, userId)
      testBandId = band.id
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('deleting event cascades RSVPs', async () => {
      if (!testBandId) return

      // Create event
      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Cascade Test Event',
          event_type: 'show',
          start_time: '2024-08-01T20:00:00Z',
          created_by: userId
        })
        .select()
        .single()

      const eventId = event!.id

      // Add RSVP
      await supabase
        .from('event_rsvps')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'going'
        })

      // Verify RSVP exists
      const { data: rsvpsBefore } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)

      expect(rsvpsBefore).toHaveLength(1)

      // Delete event
      await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      // Verify RSVPs are deleted (cascade)
      const { data: rsvpsAfter } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)

      expect(rsvpsAfter).toEqual([])
    })
  })
})
