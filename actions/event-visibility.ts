'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Helper to verify user can manage event visibility (creator or band admin)
 */
async function verifyCanManageVisibility(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  userId: string
): Promise<{ bandId: string }> {
  const { data: event } = await supabase
    .from('events')
    .select('band_id, created_by')
    .eq('id', eventId)
    .single()

  if (!event?.band_id) throw new Error('Event not found')

  const isCreator = event.created_by === userId
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', event.band_id)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single()

  if (!isCreator && !adminMember) throw new Error('Access denied')

  return { bandId: event.band_id }
}

/**
 * Set the list of users who can see a private event (replaces existing)
 */
export async function setEventVisibility(eventId: string, userIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId || typeof eventId !== 'string') throw new Error('Event ID required')
  if (!Array.isArray(userIds)) throw new Error('User IDs must be an array')

  await verifyCanManageVisibility(supabase, eventId, user.id)

  // Delete existing visibility entries for this event
  const { error: deleteError } = await supabase
    .from('event_visibility')
    .delete()
    .eq('event_id', eventId)

  if (deleteError) throw new Error('Failed to update visibility')

  // Insert new visibility entries if any
  if (userIds.length > 0) {
    const entries = userIds.map(userId => ({
      event_id: eventId,
      user_id: userId
    }))

    const { error: insertError } = await supabase
      .from('event_visibility')
      .insert(entries)

    if (insertError) throw new Error('Failed to set visibility')
  }
}

/**
 * Get the list of user IDs who can see an event
 */
export async function getEventVisibility(eventId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId || typeof eventId !== 'string') throw new Error('Event ID required')

  await verifyCanManageVisibility(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('event_visibility')
    .select('user_id')
    .eq('event_id', eventId)

  if (error) throw new Error('Failed to get visibility')

  return data.map(row => row.user_id)
}

/**
 * Add users to visibility list
 */
export async function addVisibleUsers(eventId: string, userIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId || typeof eventId !== 'string') throw new Error('Event ID required')
  if (!Array.isArray(userIds) || userIds.length === 0) throw new Error('User IDs required')

  await verifyCanManageVisibility(supabase, eventId, user.id)

  const entries = userIds.map(userId => ({
    event_id: eventId,
    user_id: userId
  }))

  // Use upsert to avoid conflicts if user already exists
  const { error } = await supabase
    .from('event_visibility')
    .upsert(entries, { onConflict: 'event_id,user_id' })

  if (error) throw new Error('Failed to add users to visibility')
}

/**
 * Remove users from visibility list
 */
export async function removeVisibleUsers(eventId: string, userIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId || typeof eventId !== 'string') throw new Error('Event ID required')
  if (!Array.isArray(userIds) || userIds.length === 0) throw new Error('User IDs required')

  await verifyCanManageVisibility(supabase, eventId, user.id)

  const { error } = await supabase
    .from('event_visibility')
    .delete()
    .eq('event_id', eventId)
    .in('user_id', userIds)

  if (error) throw new Error('Failed to remove users from visibility')
}
