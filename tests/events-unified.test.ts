import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createTestBand, cleanupBand } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Unified Event Model', () => {
  describe('Fixed Mode Events', () => {
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

      const band = await createTestBand(supabase, userId)
      testBandId = band.id
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create event with mode=fixed', async () => {
      if (!testBandId) return

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Fixed Time Event',
          event_type: 'show',
          start_time: '2024-06-01T20:00:00Z',
          end_time: '2024-06-01T23:00:00Z',
          location: 'The Venue',
          mode: 'fixed',
          visibility: 'band',
          require_rsvp: true,
          rsvp_deadline: '2024-05-30T23:59:59Z',
          status: 'open',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(event).not.toBeNull()
      expect(event?.mode).toBe('fixed')
      expect(event?.visibility).toBe('band')
      expect(event?.require_rsvp).toBe(true)
      expect(event?.status).toBe('open')

      testEventId = event?.id || null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('update event status', async () => {
      if (!testEventId) return

      const { data: updated, error } = await supabase
        .from('events')
        .update({ status: 'closed' })
        .eq('id', testEventId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated?.status).toBe('closed')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('update event to cancelled', async () => {
      if (!testEventId) return

      const { data: cancelled, error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', testEventId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(cancelled?.status).toBe('cancelled')
    })
  })

  describe('Poll Mode Events', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null
    let testPollEventId: string | null = null

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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create event with mode=poll and pollOptions', async () => {
      if (!testBandId) return

      const pollOptions = [
        { slotKey: 'slot1', date: '2024-06-01', startTime: '19:00', endTime: '22:00' },
        { slotKey: 'slot2', date: '2024-06-02', startTime: '20:00', endTime: '23:00' },
        { slotKey: 'slot3', date: '2024-06-03', startTime: '18:00', endTime: '21:00' }
      ]

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'When Should We Play?',
          event_type: 'show',
          start_time: '2024-06-01T19:00:00Z', // Placeholder
          mode: 'poll',
          poll_options: pollOptions,
          poll_closes_at: '2024-05-28T23:59:59Z',
          visibility: 'band',
          status: 'open',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(event).not.toBeNull()
      expect(event?.mode).toBe('poll')
      expect(event?.poll_options).toHaveLength(3)
      expect(event?.poll_closes_at).not.toBeNull()

      testPollEventId = event?.id || null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('poll options are preserved correctly', async () => {
      if (!testPollEventId) return

      const { data: event, error } = await supabase
        .from('events')
        .select('poll_options')
        .eq('id', testPollEventId)
        .single()

      expect(error).toBeNull()
      const options = event?.poll_options as Array<{ slotKey: string; date: string }>
      expect(options[0].slotKey).toBe('slot1')
      expect(options[1].slotKey).toBe('slot2')
      expect(options[2].date).toBe('2024-06-03')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('resolve poll converts to fixed time', async () => {
      if (!testPollEventId) return

      // Get the poll options first
      const { data: eventBefore } = await supabase
        .from('events')
        .select('poll_options')
        .eq('id', testPollEventId)
        .single()

      const options = eventBefore?.poll_options as Array<{ slotKey: string; date: string; startTime: string; endTime: string }>
      const selectedSlot = options[1] // Choose slot2

      // Resolve the poll
      const { data: resolved, error } = await supabase
        .from('events')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_slot_key: selectedSlot.slotKey,
          start_time: `${selectedSlot.date}T${selectedSlot.startTime}:00Z`,
          end_time: `${selectedSlot.date}T${selectedSlot.endTime}:00Z`
        })
        .eq('id', testPollEventId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(resolved?.resolved_at).not.toBeNull()
      expect(resolved?.resolved_slot_key).toBe('slot2')
      expect(resolved?.start_time).toContain('2024-06-02')
    })
  })

  describe('New Event Types', () => {
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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create meeting event', async () => {
      if (!testBandId) return

      const { data, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Band Meeting',
          event_type: 'meeting',
          start_time: '2024-06-15T18:00:00Z',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.event_type).toBe('meeting')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create recording event', async () => {
      if (!testBandId) return

      const { data, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Studio Recording',
          event_type: 'recording',
          start_time: '2024-07-01T10:00:00Z',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.event_type).toBe('recording')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create photoshoot event', async () => {
      if (!testBandId) return

      const { data, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Promo Photoshoot',
          event_type: 'photoshoot',
          start_time: '2024-07-15T14:00:00Z',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.event_type).toBe('photoshoot')
    })
  })
})
