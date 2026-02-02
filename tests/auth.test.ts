import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createUnauthenticatedClient } from './helpers'

describe('Authentication', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot read bands', async () => {
      const supabase = createUnauthenticatedClient()

      // RLS should block access - returns empty array, not error
      const { data, error } = await supabase.from('bands').select('*')

      // Without auth, RLS policies return empty results (no rows visible)
      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    test('unauthenticated user cannot create band', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('bands')
        .insert({ name: 'Unauthorized Band', created_by: 'fake-user-id' })
        .select()
        .single()

      // RLS should block this insert
      expect(error).not.toBeNull()
      expect(data).toBeNull()
    })

    test('unauthenticated user cannot read messages', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase.from('messages').select('*')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    test('unauthenticated user cannot read events', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase.from('events').select('*')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('Authenticated Access', () => {
    let supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>['supabase']
    let user: Awaited<ReturnType<typeof createAuthenticatedClient>>['user']

    beforeAll(async () => {
      // Skip if no test credentials configured
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD) {
        console.warn('Skipping authenticated tests - no test credentials configured')
        return
      }

      const auth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      supabase = auth.supabase
      user = auth.user
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('authenticated user has profile', async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      expect(error).toBeNull()
      expect(profile).not.toBeNull()
      expect(profile?.id).toBe(user.id)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('authenticated user can see their bands', async () => {
      // This tests that authenticated users can query bands they're members of
      const { data, error } = await supabase
        .from('bands')
        .select(`
          *,
          band_members!inner(user_id)
        `)
        .eq('band_members.user_id', user.id)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('session is valid', async () => {
      const { data: { session } } = await supabase.auth.getSession()

      expect(session).not.toBeNull()
      expect(session?.user.id).toBe(user.id)
    })
  })

  describe('Sign Out', () => {
    test.skipIf(!process.env.TEST_USER_1_EMAIL)('sign out clears session', async () => {
      // Skip if no test credentials
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD) {
        return
      }

      // Create a fresh client and sign in
      const { supabase } = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )

      // Verify session exists
      const { data: { session: beforeSession } } = await supabase.auth.getSession()
      expect(beforeSession).not.toBeNull()

      // Sign out
      await supabase.auth.signOut()

      // Verify session is cleared
      const { data: { session: afterSession } } = await supabase.auth.getSession()
      expect(afterSession).toBeNull()
    })
  })
})
