import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createTestBand, cleanupBand } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Event Visibility', () => {
  describe('Private Event Visibility', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null
    let privateEventId: string | null = null

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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create private event', async () => {
      if (!testBandId) return

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Private Meeting',
          event_type: 'meeting',
          start_time: '2024-06-01T18:00:00Z',
          visibility: 'private',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(event).not.toBeNull()
      expect(event?.visibility).toBe('private')

      privateEventId = event?.id || null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('add users to visibility list', async () => {
      if (!privateEventId) return

      // Add creator to visibility list (for testing)
      const { error } = await supabase
        .from('event_visibility')
        .insert({
          event_id: privateEventId,
          user_id: userId
        })

      expect(error).toBeNull()
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('get visibility entries', async () => {
      if (!privateEventId) return

      const { data: entries, error } = await supabase
        .from('event_visibility')
        .select('user_id')
        .eq('event_id', privateEventId)

      expect(error).toBeNull()
      expect(entries).toHaveLength(1)
      expect(entries?.[0].user_id).toBe(userId)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('upsert visibility entry (no duplicate)', async () => {
      if (!privateEventId) return

      // Try to add same user again - should upsert
      const { error } = await supabase
        .from('event_visibility')
        .upsert({
          event_id: privateEventId,
          user_id: userId
        }, {
          onConflict: 'event_id,user_id'
        })

      expect(error).toBeNull()

      // Verify still only one entry
      const { data: entries } = await supabase
        .from('event_visibility')
        .select('user_id')
        .eq('event_id', privateEventId)

      expect(entries).toHaveLength(1)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('remove user from visibility', async () => {
      if (!privateEventId) return

      const { error } = await supabase
        .from('event_visibility')
        .delete()
        .eq('event_id', privateEventId)
        .eq('user_id', userId)

      expect(error).toBeNull()

      // Verify removed
      const { data: entries } = await supabase
        .from('event_visibility')
        .select('user_id')
        .eq('event_id', privateEventId)

      expect(entries).toEqual([])
    })
  })

  describe('Band Visibility Events', () => {
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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('band visibility event has no visibility entries', async () => {
      if (!testBandId) return

      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Band Event',
          event_type: 'rehearsal',
          start_time: '2024-06-15T19:00:00Z',
          visibility: 'band',
          created_by: userId
        })
        .select()
        .single()

      expect(event?.visibility).toBe('band')

      // Check no visibility entries needed
      const { data: entries } = await supabase
        .from('event_visibility')
        .select('*')
        .eq('event_id', event!.id)

      expect(entries).toEqual([])
    })
  })

  describe('Visibility Cascade Deletion', () => {
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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('deleting event cascades visibility entries', async () => {
      if (!testBandId) return

      // Create private event
      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Cascade Test Private',
          event_type: 'meeting',
          start_time: '2024-08-01T18:00:00Z',
          visibility: 'private',
          created_by: userId
        })
        .select()
        .single()

      const eventId = event!.id

      // Add visibility entry
      await supabase
        .from('event_visibility')
        .insert({
          event_id: eventId,
          user_id: userId
        })

      // Verify visibility entry exists
      const { data: visibilityBefore } = await supabase
        .from('event_visibility')
        .select('*')
        .eq('event_id', eventId)

      expect(visibilityBefore).toHaveLength(1)

      // Delete event
      await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      // Verify visibility entries are deleted (cascade)
      const { data: visibilityAfter } = await supabase
        .from('event_visibility')
        .select('*')
        .eq('event_id', eventId)

      expect(visibilityAfter).toEqual([])
    })
  })

  describe('Creator Always Sees Private Event', () => {
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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('creator can see own private event without visibility entry', async () => {
      if (!testBandId) return

      // Create private event without adding self to visibility list
      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Creator Private Event',
          event_type: 'meeting',
          start_time: '2024-09-01T18:00:00Z',
          visibility: 'private',
          created_by: userId
        })
        .select()
        .single()

      const eventId = event!.id

      // RLS should allow creator to see their own private event
      // Note: This relies on the updated RLS policy that includes created_by check
      const { data: fetched, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      expect(error).toBeNull()
      expect(fetched).not.toBeNull()
      expect(fetched?.id).toBe(eventId)
    })
  })
})
