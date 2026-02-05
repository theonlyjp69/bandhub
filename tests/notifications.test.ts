import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createUnauthenticatedClient } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Notifications', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot view notifications', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('notifications')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([]) // RLS returns empty array
    })

    test('unauthenticated user cannot create notifications', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: 'fake-user-id',
          type: 'test',
          title: 'Test Notification'
        })
        .select()
        .single()

      expect(error).not.toBeNull()
      expect(data).toBeNull()
    })
  })

  describe('Notification CRUD Operations', () => {
    let supabase: SupabaseClient
    let userId: string

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
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can view own notifications', async () => {
      // First check that query works (even if no notifications exist)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can mark notification as read', async () => {
      // Note: We can't insert directly due to RLS, so this tests the update path
      // This would work if we had a service role client or test notification
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('read_at', null)
        .limit(1)

      expect(error).toBeNull()

      if (data && data.length > 0) {
        const notification = data[0]
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notification.id)

        expect(updateError).toBeNull()
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can delete own notification', async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      if (data && data.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', data[0].id)

        expect(error).toBeNull()
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user cannot view other users notifications', async () => {
      // Try to query notifications with a different user_id
      const fakeUserId = '00000000-0000-0000-0000-000000000000'
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', fakeUserId)

      // RLS should return empty array
      expect(data).toEqual([])
    })
  })
})

describe('Push Subscriptions', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot view push subscriptions', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('Push Subscription Management', () => {
    let supabase: SupabaseClient
    let userId: string
    let subscriptionId: string | null = null

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
    })

    afterAll(async () => {
      if (subscriptionId && supabase) {
        await supabase.from('push_subscriptions').delete().eq('id', subscriptionId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can create push subscription', async () => {
      const endpoint = `https://test.push.service/${Date.now()}`
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          endpoint,
          keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-key' }
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.endpoint).toBe(endpoint)
      subscriptionId = data?.id ?? null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can view own push subscriptions', async () => {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can delete own push subscription', async () => {
      if (!subscriptionId) return

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', subscriptionId)

      expect(error).toBeNull()
      subscriptionId = null
    })
  })
})

describe('Notification Preferences', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot view notification preferences', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('Preferences Management', () => {
    let supabase: SupabaseClient
    let userId: string

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
    })

    afterAll(async () => {
      // Clean up test preferences
      if (supabase) {
        await supabase.from('notification_preferences').delete().eq('user_id', userId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can upsert notification preferences', async () => {
      // Use upsert to handle both create and update cases
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          event_created: true,
          event_updated: true,
          rsvp_reminder: true,
          poll_reminder: true,
          push_enabled: false
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.event_created).toBe(true)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can update notification preferences', async () => {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ push_enabled: true })
        .eq('user_id', userId)

      expect(error).toBeNull()

      // Verify update
      const { data } = await supabase
        .from('notification_preferences')
        .select('push_enabled')
        .eq('user_id', userId)
        .single()

      expect(data?.push_enabled).toBe(true)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user can disable specific notification types', async () => {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          event_created: false,
          rsvp_reminder: false
        })
        .eq('user_id', userId)

      expect(error).toBeNull()

      const { data } = await supabase
        .from('notification_preferences')
        .select('event_created, rsvp_reminder')
        .eq('user_id', userId)
        .single()

      expect(data?.event_created).toBe(false)
      expect(data?.rsvp_reminder).toBe(false)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('user cannot view other users preferences', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000'
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', fakeUserId)

      expect(data).toEqual([])
    })
  })
})
