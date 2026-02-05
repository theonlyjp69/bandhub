'use server'

import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Verifies user is a member of the band that owns the event.
 * Throws if event not found or user is not a member.
 */
async function verifyEventMembership(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<void> {
  const { data: event } = await supabase
    .from('events')
    .select('band_id')
    .eq('id', eventId)
    .single()

  if (!event?.band_id) throw new Error('Event not found')

  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', event.band_id)
    .eq('user_id', userId)
    .single()

  if (!member) throw new Error('Access denied')
}

export async function setRsvp(eventId: string, status: 'going' | 'maybe' | 'not_going', note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')
  if (!['going', 'maybe', 'not_going'].includes(status)) {
    throw new Error('Invalid status')
  }
  if (note && note.length > 500) throw new Error('Note too long (max 500)')

  await verifyEventMembership(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      status,
      note: note ?? null
    }, {
      onConflict: 'event_id,user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEventRsvps(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventMembership(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('event_rsvps')
    .select(`
      *,
      profiles(id, display_name, avatar_url)
    `)
    .eq('event_id', eventId)

  if (error) throw error
  return data
}

export async function getUserRsvp(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null
  if (!eventId) throw new Error('Event ID required')

  await verifyEventMembership(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error  // PGRST116 = no rows
  return data
}

export async function removeRsvp(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventMembership(supabase, eventId, user.id)

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) throw error
}
