import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createUnauthenticatedClient, createTestBand, cleanupBand, addBandMember } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Communication', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot view announcements', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('announcements')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([]) // RLS returns empty array
    })

    test('unauthenticated user cannot view threads', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('threads')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([]) // RLS returns empty array
    })

    test('unauthenticated user cannot view messages', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('messages')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([]) // RLS returns empty array
    })

    test('unauthenticated user cannot create announcement', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          band_id: 'fake-band-id',
          title: 'Unauthorized',
          content: 'Test',
          created_by: 'fake-user-id'
        })
        .select()
        .single()

      expect(error).not.toBeNull()
      expect(data).toBeNull()
    })
  })

  describe('Announcements', () => {
    let adminSupabase: SupabaseClient
    let adminUserId: string
    let memberSupabase: SupabaseClient
    let memberUserId: string
    let testBandId: string | null = null
    let testAnnouncementId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD ||
          !process.env.TEST_USER_2_EMAIL || !process.env.TEST_USER_2_PASSWORD) {
        return
      }

      // Setup admin user
      const adminAuth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      adminSupabase = adminAuth.supabase
      adminUserId = adminAuth.user.id

      // Setup member user
      const memberAuth = await createAuthenticatedClient(
        process.env.TEST_USER_2_EMAIL,
        process.env.TEST_USER_2_PASSWORD
      )
      memberSupabase = memberAuth.supabase
      memberUserId = memberAuth.user.id

      // Create test band with admin
      const band = await createTestBand(adminSupabase, adminUserId)
      testBandId = band.id

      // Add member to band
      await addBandMember(adminSupabase, testBandId, memberUserId, 'member')
    })

    afterAll(async () => {
      if (testBandId && adminSupabase) {
        await cleanupBand(adminSupabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('admin can create announcement', async () => {
      if (!testBandId) return

      const { data: announcement, error } = await adminSupabase
        .from('announcements')
        .insert({
          band_id: testBandId,
          title: 'Important Update',
          content: 'This is a test announcement for the band.',
          created_by: adminUserId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(announcement).not.toBeNull()
      expect(announcement?.title).toBe('Important Update')
      expect(announcement?.content).toBe('This is a test announcement for the band.')

      testAnnouncementId = announcement?.id || null
    })

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('member cannot create announcement (RLS blocks)', async () => {
      if (!testBandId) return

      // Note: RLS policy should block non-admin from creating announcements
      // The insert may silently fail or return error depending on policy
      const { data, error } = await memberSupabase
        .from('announcements')
        .insert({
          band_id: testBandId,
          title: 'Unauthorized Announcement',
          content: 'This should not work.',
          created_by: memberUserId
        })
        .select()
        .single()

      // Either error or no data returned
      expect(data === null || error !== null).toBe(true)
    })

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('member can view announcements', async () => {
      if (!testBandId) return

      const { data: announcements, error } = await memberSupabase
        .from('announcements')
        .select('*')
        .eq('band_id', testBandId)

      expect(error).toBeNull()
      expect(announcements).not.toBeNull()
      // Should be able to see the admin's announcement
      expect(announcements!.length).toBeGreaterThan(0)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('admin can delete announcement', async () => {
      if (!testAnnouncementId) return

      const { error } = await adminSupabase
        .from('announcements')
        .delete()
        .eq('id', testAnnouncementId)

      expect(error).toBeNull()

      // Verify deletion
      const { data: check } = await adminSupabase
        .from('announcements')
        .select('id')
        .eq('id', testAnnouncementId)

      expect(check).toEqual([])
      testAnnouncementId = null
    })
  })

  describe('Threads', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null
    let testThreadId: string | null = null

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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('member can create thread', async () => {
      if (!testBandId) return

      const { data: thread, error } = await supabase
        .from('threads')
        .insert({
          band_id: testBandId,
          title: 'Setlist Discussion',
          created_by: userId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(thread).not.toBeNull()
      expect(thread?.title).toBe('Setlist Discussion')

      testThreadId = thread?.id || null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can get band threads', async () => {
      if (!testBandId) return

      const { data: threads, error } = await supabase
        .from('threads')
        .select(`
          *,
          profiles!created_by(display_name)
        `)
        .eq('band_id', testBandId)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(threads).not.toBeNull()
      expect(threads!.length).toBeGreaterThan(0)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can get single thread', async () => {
      if (!testThreadId) return

      const { data: thread, error } = await supabase
        .from('threads')
        .select(`
          *,
          profiles!created_by(display_name, avatar_url)
        `)
        .eq('id', testThreadId)
        .single()

      expect(error).toBeNull()
      expect(thread).not.toBeNull()
      expect(thread?.id).toBe(testThreadId)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can delete thread', async () => {
      if (!testThreadId) return

      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', testThreadId)

      expect(error).toBeNull()

      // Verify deletion
      const { data: check } = await supabase
        .from('threads')
        .select('id')
        .eq('id', testThreadId)

      expect(check).toEqual([])
      testThreadId = null
    })
  })

  describe('Messages', () => {
    let supabase: SupabaseClient
    let userId: string
    let testBandId: string | null = null
    let testThreadId: string | null = null
    let mainChatMessageId: string | null = null
    let threadMessageId: string | null = null

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

      // Create a thread for message tests
      const { data: thread } = await supabase
        .from('threads')
        .insert({
          band_id: testBandId,
          title: 'Message Test Thread',
          created_by: userId
        })
        .select()
        .single()

      testThreadId = thread?.id || null
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can send message to main chat', async () => {
      if (!testBandId) return

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          band_id: testBandId,
          content: 'Hello band! This is a main chat message.',
          user_id: userId,
          thread_id: null
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(message).not.toBeNull()
      expect(message?.content).toBe('Hello band! This is a main chat message.')
      expect(message?.thread_id).toBeNull()

      mainChatMessageId = message?.id || null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can send message to thread', async () => {
      if (!testBandId || !testThreadId) return

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          band_id: testBandId,
          content: 'This is a thread reply.',
          user_id: userId,
          thread_id: testThreadId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(message).not.toBeNull()
      expect(message?.content).toBe('This is a thread reply.')
      expect(message?.thread_id).toBe(testThreadId)

      threadMessageId = message?.id || null
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('messages are separate by thread', async () => {
      if (!testBandId || !testThreadId) return

      // Get main chat messages (thread_id is null)
      const { data: mainMessages, error: mainError } = await supabase
        .from('messages')
        .select('*')
        .eq('band_id', testBandId)
        .is('thread_id', null)

      expect(mainError).toBeNull()
      expect(mainMessages).not.toBeNull()

      // Get thread messages
      const { data: threadMessages, error: threadError } = await supabase
        .from('messages')
        .select('*')
        .eq('band_id', testBandId)
        .eq('thread_id', testThreadId)

      expect(threadError).toBeNull()
      expect(threadMessages).not.toBeNull()

      // Verify they are separate
      const mainIds = mainMessages!.map(m => m.id)
      const threadIds = threadMessages!.map(m => m.id)

      // No overlap between main chat and thread messages
      const overlap = mainIds.filter(id => threadIds.includes(id))
      expect(overlap).toHaveLength(0)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can get messages with profile info', async () => {
      if (!testBandId) return

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!user_id(display_name, avatar_url)
        `)
        .eq('band_id', testBandId)
        .order('created_at', { ascending: true })

      expect(error).toBeNull()
      expect(messages).not.toBeNull()
      expect(messages!.length).toBeGreaterThan(0)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can delete own message', async () => {
      if (!mainChatMessageId) return

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', mainChatMessageId)

      expect(error).toBeNull()

      // Verify deletion
      const { data: check } = await supabase
        .from('messages')
        .select('id')
        .eq('id', mainChatMessageId)

      expect(check).toEqual([])
      mainChatMessageId = null
    })
  })

  describe('Message Permissions', () => {
    let adminSupabase: SupabaseClient
    let adminUserId: string
    let memberSupabase: SupabaseClient
    let memberUserId: string
    let testBandId: string | null = null
    let memberMessageId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD ||
          !process.env.TEST_USER_2_EMAIL || !process.env.TEST_USER_2_PASSWORD) {
        return
      }

      // Setup admin
      const adminAuth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      adminSupabase = adminAuth.supabase
      adminUserId = adminAuth.user.id

      // Setup member
      const memberAuth = await createAuthenticatedClient(
        process.env.TEST_USER_2_EMAIL,
        process.env.TEST_USER_2_PASSWORD
      )
      memberSupabase = memberAuth.supabase
      memberUserId = memberAuth.user.id

      // Create band
      const band = await createTestBand(adminSupabase, adminUserId)
      testBandId = band.id

      // Add member
      await addBandMember(adminSupabase, testBandId, memberUserId, 'member')

      // Member sends a message
      const { data: msg } = await memberSupabase
        .from('messages')
        .insert({
          band_id: testBandId,
          content: 'Message from member',
          user_id: memberUserId,
          thread_id: null
        })
        .select()
        .single()

      memberMessageId = msg?.id || null
    })

    afterAll(async () => {
      if (testBandId && adminSupabase) {
        await cleanupBand(adminSupabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('member can view messages', async () => {
      if (!testBandId) return

      const { data: messages, error } = await memberSupabase
        .from('messages')
        .select('*')
        .eq('band_id', testBandId)

      expect(error).toBeNull()
      expect(messages).not.toBeNull()
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('admin can delete member message', async () => {
      if (!memberMessageId) return

      // Admin deletes member's message
      const { error } = await adminSupabase
        .from('messages')
        .delete()
        .eq('id', memberMessageId)

      expect(error).toBeNull()

      // Verify deletion
      const { data: check } = await adminSupabase
        .from('messages')
        .select('id')
        .eq('id', memberMessageId)

      expect(check).toEqual([])
      memberMessageId = null
    })
  })

  describe('Event Chat', () => {
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

      // Create a test event for chat
      const { data: event } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Chat Test Event',
          start_time: new Date().toISOString(),
          created_by: userId,
          mode: 'fixed',
          status: 'open'
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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can send message to event chat', async () => {
      if (!testBandId || !testEventId) return

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          band_id: testBandId,
          content: 'Event discussion message',
          user_id: userId,
          event_id: testEventId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(message).not.toBeNull()
      expect(message?.content).toBe('Event discussion message')
      expect(message?.event_id).toBe(testEventId)
      expect(message?.thread_id).toBeNull()
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('event messages are separate from main chat', async () => {
      if (!testBandId || !testEventId) return

      // Send a main chat message
      await supabase.from('messages').insert({
        band_id: testBandId,
        content: 'Main chat message',
        user_id: userId,
        thread_id: null,
        event_id: null
      })

      // Get main chat (no thread, no event)
      const { data: mainMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('band_id', testBandId)
        .is('thread_id', null)
        .is('event_id', null)

      // Get event chat
      const { data: eventMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('band_id', testBandId)
        .eq('event_id', testEventId)

      expect(mainMessages).not.toBeNull()
      expect(eventMessages).not.toBeNull()

      // No overlap
      const mainIds = mainMessages!.map(m => m.id)
      const eventIds = eventMessages!.map(m => m.id)
      const overlap = mainIds.filter(id => eventIds.includes(id))
      expect(overlap).toHaveLength(0)

      // Event messages should have event_id set
      for (const msg of eventMessages!) {
        expect(msg.event_id).toBe(testEventId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('deleting event cascades messages', async () => {
      if (!testBandId) return

      // Create a temporary event
      const { data: tempEvent } = await supabase
        .from('events')
        .insert({
          band_id: testBandId,
          title: 'Temp Cascade Event',
          start_time: new Date().toISOString(),
          created_by: userId,
          mode: 'fixed',
          status: 'open'
        })
        .select()
        .single()

      const tempEventId = tempEvent!.id

      // Add messages to event
      await supabase.from('messages').insert([
        { band_id: testBandId, event_id: tempEventId, content: 'Event msg 1', user_id: userId },
        { band_id: testBandId, event_id: tempEventId, content: 'Event msg 2', user_id: userId }
      ])

      // Verify messages exist
      const { data: before } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', tempEventId)

      expect(before).toHaveLength(2)

      // Delete event
      await supabase.from('events').delete().eq('id', tempEventId)

      // Verify messages are deleted (cascade)
      const { data: after } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', tempEventId)

      expect(after).toEqual([])
    })
  })

  describe('Thread Cascade Deletion', () => {
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

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('deleting thread cascades messages', async () => {
      if (!testBandId) return

      // Create thread
      const { data: thread } = await supabase
        .from('threads')
        .insert({
          band_id: testBandId,
          title: 'Cascade Test Thread',
          created_by: userId
        })
        .select()
        .single()

      const threadId = thread!.id

      // Add messages to thread
      await supabase.from('messages').insert([
        { band_id: testBandId, thread_id: threadId, content: 'Message 1', user_id: userId },
        { band_id: testBandId, thread_id: threadId, content: 'Message 2', user_id: userId }
      ])

      // Verify messages exist
      const { data: messagesBefore } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)

      expect(messagesBefore).toHaveLength(2)

      // Delete thread
      await supabase
        .from('threads')
        .delete()
        .eq('id', threadId)

      // Verify messages are deleted (cascade)
      const { data: messagesAfter } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)

      expect(messagesAfter).toEqual([])
    })
  })
})
