import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedClient, createUnauthenticatedClient, createTestBand, cleanupBand, generateTestBandName, addBandMember } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Band Management', () => {
  describe('Unauthenticated Access', () => {
    test('unauthenticated user cannot create band', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('bands')
        .insert({ name: 'Unauthorized Band', created_by: 'fake-user-id' })
        .select()
        .single()

      expect(error).not.toBeNull()
      expect(data).toBeNull()
    })

    test('unauthenticated user cannot view bands', async () => {
      const supabase = createUnauthenticatedClient()

      const { data, error } = await supabase
        .from('bands')
        .select('*')

      expect(error).toBeNull()
      expect(data).toEqual([]) // RLS returns empty array for unauthenticated
    })
  })

  describe('Band Creation', () => {
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
    })

    afterAll(async () => {
      if (testBandId && supabase) {
        await cleanupBand(supabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('create band makes user admin', async () => {
      const bandName = generateTestBandName()

      // Create band
      const { data: band, error } = await supabase
        .from('bands')
        .insert({ name: bandName, created_by: userId })
        .select()
        .single()

      expect(error).toBeNull()
      expect(band).not.toBeNull()
      expect(band?.name).toBe(bandName)
      testBandId = band?.id || null

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('band_members')
        .insert({ band_id: band!.id, user_id: userId, role: 'admin' })

      expect(memberError).toBeNull()

      // Verify admin role
      const { data: members } = await supabase
        .from('band_members')
        .select('*')
        .eq('band_id', band!.id)

      expect(members).toHaveLength(1)
      expect(members![0].role).toBe('admin')
      expect(members![0].user_id).toBe(userId)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can view band after creating', async () => {
      if (!testBandId) return

      const { data: band, error } = await supabase
        .from('bands')
        .select('*')
        .eq('id', testBandId)
        .single()

      expect(error).toBeNull()
      expect(band).not.toBeNull()
      expect(band?.id).toBe(testBandId)
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('can view band members', async () => {
      if (!testBandId) return

      const { data: members, error } = await supabase
        .from('band_members')
        .select(`
          *,
          profiles(id, display_name, avatar_url)
        `)
        .eq('band_id', testBandId)

      expect(error).toBeNull()
      expect(members).not.toBeNull()
      expect(members!.length).toBeGreaterThan(0)
    })
  })

  describe('Invitation Flow', () => {
    let adminSupabase: SupabaseClient
    let adminUserId: string
    let testBandId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD) {
        return
      }
      const auth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      adminSupabase = auth.supabase
      adminUserId = auth.user.id

      // Create a test band
      const band = await createTestBand(adminSupabase, adminUserId)
      testBandId = band.id
    })

    afterAll(async () => {
      if (testBandId && adminSupabase) {
        await cleanupBand(adminSupabase, testBandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('admin can create invitation', async () => {
      if (!testBandId) return

      const testEmail = `test-invite-${Date.now()}@example.com`

      const { data: invitation, error } = await adminSupabase
        .from('invitations')
        .insert({
          band_id: testBandId,
          email: testEmail,
          invited_by: adminUserId,
          status: 'pending'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(invitation).not.toBeNull()
      expect(invitation?.email).toBe(testEmail)
      expect(invitation?.status).toBe('pending')
    })

    test.skipIf(!process.env.TEST_USER_1_EMAIL)('cannot create duplicate pending invitation', async () => {
      if (!testBandId) return

      const testEmail = `test-dupe-${Date.now()}@example.com`

      // Create first invitation
      await adminSupabase
        .from('invitations')
        .insert({
          band_id: testBandId,
          email: testEmail,
          invited_by: adminUserId,
          status: 'pending'
        })

      // Try to create duplicate
      const { data, error } = await adminSupabase
        .from('invitations')
        .insert({
          band_id: testBandId,
          email: testEmail,
          invited_by: adminUserId,
          status: 'pending'
        })
        .select()
        .single()

      // Should fail due to unique constraint or RLS
      expect(error).not.toBeNull()
    })
  })

  describe('Permission Checks', () => {
    let adminSupabase: SupabaseClient
    let adminUserId: string
    let memberSupabase: SupabaseClient
    let memberUserId: string
    let testBandId: string | null = null

    beforeAll(async () => {
      // Skip if either user is not configured
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

      // Create a test band with admin as owner
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

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('member can view band', async () => {
      if (!testBandId) return

      const { data: band, error } = await memberSupabase
        .from('bands')
        .select('*')
        .eq('id', testBandId)
        .single()

      expect(error).toBeNull()
      expect(band).not.toBeNull()
    })

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('member can view band members', async () => {
      if (!testBandId) return

      const { data: members, error } = await memberSupabase
        .from('band_members')
        .select('*')
        .eq('band_id', testBandId)

      expect(error).toBeNull()
      expect(members).not.toBeNull()
      expect(members!.length).toBeGreaterThanOrEqual(2)
    })

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('non-admin cannot update roles via RLS', async () => {
      if (!testBandId) return

      // Get admin's member record
      const { data: adminMember } = await memberSupabase
        .from('band_members')
        .select('id')
        .eq('band_id', testBandId)
        .eq('user_id', adminUserId)
        .single()

      if (!adminMember) return

      // Try to update admin's role (should fail)
      const { error } = await memberSupabase
        .from('band_members')
        .update({ role: 'member' })
        .eq('id', adminMember.id)

      // RLS should block non-admin from updating roles
      // Either returns error or doesn't update any rows
      const { data: checkMember } = await adminSupabase
        .from('band_members')
        .select('role')
        .eq('id', adminMember.id)
        .single()

      expect(checkMember?.role).toBe('admin') // Should still be admin
    })
  })

  describe('RLS Policy Verification', () => {
    let user1Supabase: SupabaseClient
    let user1Id: string
    let user2Supabase: SupabaseClient
    let user1BandId: string | null = null

    beforeAll(async () => {
      if (!process.env.TEST_USER_1_EMAIL || !process.env.TEST_USER_1_PASSWORD ||
          !process.env.TEST_USER_2_EMAIL || !process.env.TEST_USER_2_PASSWORD) {
        return
      }

      const user1Auth = await createAuthenticatedClient(
        process.env.TEST_USER_1_EMAIL,
        process.env.TEST_USER_1_PASSWORD
      )
      user1Supabase = user1Auth.supabase
      user1Id = user1Auth.user.id

      const user2Auth = await createAuthenticatedClient(
        process.env.TEST_USER_2_EMAIL,
        process.env.TEST_USER_2_PASSWORD
      )
      user2Supabase = user2Auth.supabase

      // User 1 creates a private band
      const band = await createTestBand(user1Supabase, user1Id, `Private Band ${Date.now()}`)
      user1BandId = band.id
    })

    afterAll(async () => {
      if (user1BandId && user1Supabase) {
        await cleanupBand(user1Supabase, user1BandId)
      }
    })

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('user cannot see bands they are not a member of', async () => {
      if (!user1BandId) return

      // User 2 should not be able to see User 1's band
      const { data: bands, error } = await user2Supabase
        .from('bands')
        .select('*')
        .eq('id', user1BandId)

      expect(error).toBeNull()
      expect(bands).toEqual([]) // RLS should hide this band
    })

    test.skipIf(!process.env.TEST_USER_2_EMAIL)('user cannot see members of bands they are not in', async () => {
      if (!user1BandId) return

      // User 2 should not be able to see User 1's band members
      const { data: members, error } = await user2Supabase
        .from('band_members')
        .select('*')
        .eq('band_id', user1BandId)

      expect(error).toBeNull()
      expect(members).toEqual([]) // RLS should hide these members
    })
  })
})
