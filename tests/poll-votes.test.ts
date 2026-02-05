import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createTestBand, cleanupBand } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Poll Votes', () => {
  describe('Vote CRUD Operations', () => {
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

      // Create test band
      const band = await createTestBand(supabase, userId)
      testBandId = band.id

      // Create a poll event
      const pollOptions = [
        { slotKey: 'slot1', date: '2024-06-01', startTime: '19:00', endTime: '22:00' },
        { slotKey: 'slot2', date: '2024-06-02', startTime: '20:00', endTime: '23:00' }
      ]

      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Vote Test Poll',
          event_type: 'show',
          start_time: '2024-06-01T19:00:00Z',
          mode: 'poll',
          poll_options: pollOptions,
          visibility: 'band',
          created_by: userId
        })
        .select()
        .single()

      testPollEventId = event?.id || null
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('submit vote creates record', async () => {
      if (!testPollEventId) return

      const { data: vote, error } = await supabase
        .from('poll_votes')
        .insert({
          event_id: testPollEventId,
          user_id: userId,
          slot_key: 'slot1',
          response: 'available'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(vote).not.toBeNull()
      expect(vote?.slot_key).toBe('slot1')
      expect(vote?.response).toBe('available')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('submit vote for another slot', async () => {
      if (!testPollEventId) return

      const { data: vote, error } = await supabase
        .from('poll_votes')
        .insert({
          event_id: testPollEventId,
          user_id: userId,
          slot_key: 'slot2',
          response: 'maybe'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(vote?.slot_key).toBe('slot2')
      expect(vote?.response).toBe('maybe')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('upsert updates existing vote', async () => {
      if (!testPollEventId) return

      // Update slot1 vote from 'available' to 'unavailable'
      const { data: updated, error } = await supabase
        .from('poll_votes')
        .upsert({
          event_id: testPollEventId,
          user_id: userId,
          slot_key: 'slot1',
          response: 'unavailable'
        }, {
          onConflict: 'event_id,user_id,slot_key'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated?.response).toBe('unavailable')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('get all votes for event', async () => {
      if (!testPollEventId) return

      const { data: votes, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('event_id', testPollEventId)

      expect(error).toBeNull()
      expect(votes).toHaveLength(2) // slot1 and slot2 votes
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('get user votes for event', async () => {
      if (!testPollEventId) return

      const { data: votes, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('event_id', testPollEventId)
        .eq('user_id', userId)

      expect(error).toBeNull()
      expect(votes).toHaveLength(2)
      expect(votes?.map(v => v.slot_key).sort()).toEqual(['slot1', 'slot2'])
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('delete vote', async () => {
      if (!testPollEventId) return

      const { error } = await supabase
        .from('poll_votes')
        .delete()
        .eq('event_id', testPollEventId)
        .eq('user_id', userId)
        .eq('slot_key', 'slot2')

      expect(error).toBeNull()

      // Verify only slot1 vote remains
      const { data: remaining } = await supabase
        .from('poll_votes')
        .select('slot_key')
        .eq('event_id', testPollEventId)
        .eq('user_id', userId)

      expect(remaining).toHaveLength(1)
      expect(remaining?.[0].slot_key).toBe('slot1')
    })
  })

  describe('Vote Response Types', () => {
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

      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Response Type Test',
          event_type: 'rehearsal',
          start_time: '2024-06-01T19:00:00Z',
          mode: 'poll',
          poll_options: [
            { slotKey: 'a', date: '2024-06-01', startTime: '19:00', endTime: '21:00' },
            { slotKey: 'b', date: '2024-06-02', startTime: '19:00', endTime: '21:00' },
            { slotKey: 'c', date: '2024-06-03', startTime: '19:00', endTime: '21:00' }
          ],
          created_by: userId
        })
        .select()
        .single()

      testPollEventId = event?.id || null
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('available response', async () => {
      if (!testPollEventId) return

      const { data, error } = await supabase
        .from('poll_votes')
        .insert({
          event_id: testPollEventId,
          user_id: userId,
          slot_key: 'a',
          response: 'available'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.response).toBe('available')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('maybe response', async () => {
      if (!testPollEventId) return

      const { data, error } = await supabase
        .from('poll_votes')
        .insert({
          event_id: testPollEventId,
          user_id: userId,
          slot_key: 'b',
          response: 'maybe'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.response).toBe('maybe')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('unavailable response', async () => {
      if (!testPollEventId) return

      const { data, error } = await supabase
        .from('poll_votes')
        .insert({
          event_id: testPollEventId,
          user_id: userId,
          slot_key: 'c',
          response: 'unavailable'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.response).toBe('unavailable')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('invalid response rejected', async () => {
      if (!testPollEventId) return

      const { error } = await supabase
        .from('poll_votes')
        .insert({
          event_id: testPollEventId,
          user_id: userId,
          slot_key: 'd',
          response: 'invalid_response'
        })

      expect(error).not.toBeNull()
    })
  })

  describe('Vote Cascade Deletion', () => {
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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('deleting event cascades poll votes', async () => {
      if (!testBandId) return

      // Create poll event
      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Cascade Test Poll',
          event_type: 'show',
          start_time: '2024-08-01T20:00:00Z',
          mode: 'poll',
          poll_options: [{ slotKey: 'x', date: '2024-08-01', startTime: '20:00', endTime: '23:00' }],
          created_by: userId
        })
        .select()
        .single()

      const eventId = event!.id

      // Add vote
      await supabase
        .from('poll_votes')
        .insert({
          event_id: eventId,
          user_id: userId,
          slot_key: 'x',
          response: 'available'
        })

      // Verify vote exists
      const { data: votesBefore } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('event_id', eventId)

      expect(votesBefore).toHaveLength(1)

      // Delete event
      await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      // Verify votes are deleted (cascade)
      const { data: votesAfter } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('event_id', eventId)

      expect(votesAfter).toEqual([])
    })
  })
})
