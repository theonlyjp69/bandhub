'use server'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

interface CreateEventInput {
  bandId: string
  title: string
  eventType: 'show' | 'rehearsal' | 'deadline' | 'other'
  startTime: string
  endTime?: string
  location?: string
  description?: string
  metadata?: Record<string, unknown>
}

export async function createEvent(input: CreateEventInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!input.bandId || !input.title || !input.eventType || !input.startTime) {
    throw new Error('Missing required fields')
  }

  // Input length limits
  if (input.title.length > 200) throw new Error('Title too long (max 200)')
  if (input.description && input.description.length > 5000) throw new Error('Description too long (max 5000)')
  if (input.location && input.location.length > 500) throw new Error('Location too long (max 500)')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', input.bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('events')
    .insert({
      band_id: input.bandId,
      title: input.title,
      event_type: input.eventType,
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location,
      description: input.description,
      metadata: (input.metadata || {}) as Json,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(eventId: string, updates: Partial<Omit<CreateEventInput, 'bandId'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  // Get event and verify access (creator or admin)
  const { data: event } = await supabase
    .from('events')
    .select('band_id, created_by')
    .eq('id', eventId)
    .single()

  if (!event || !event.band_id) throw new Error('Event not found')

  // Check if user is creator or admin
  const isCreator = event.created_by === user.id
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', event.band_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!isCreator && !adminMember) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('events')
    .update({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.eventType !== undefined && { event_type: updates.eventType }),
      ...(updates.startTime !== undefined && { start_time: updates.startTime }),
      ...(updates.endTime !== undefined && { end_time: updates.endTime }),
      ...(updates.location !== undefined && { location: updates.location }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.metadata !== undefined && { metadata: updates.metadata as Json })
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  // Get event and verify access (creator or admin)
  const { data: event } = await supabase
    .from('events')
    .select('band_id, created_by')
    .eq('id', eventId)
    .single()

  if (!event || !event.band_id) throw new Error('Event not found')

  // Check if user is creator or admin
  const isCreator = event.created_by === user.id
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', event.band_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!isCreator && !adminMember) throw new Error('Access denied')

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

export async function getBandEvents(bandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId) throw new Error('Band ID required')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_rsvps(user_id, status),
      profiles!created_by(display_name)
    `)
    .eq('band_id', bandId)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export async function getEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  // Get event first to check band membership
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      event_rsvps(
        user_id,
        status,
        profiles(display_name, avatar_url)
      ),
      profiles!created_by(display_name)
    `)
    .eq('id', eventId)
    .single()

  if (error) throw error
  if (!event || !event.band_id) throw new Error('Event not found')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', event.band_id)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  return event
}

export async function getUpcomingEvents(bandId: string, limit = 5) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId) throw new Error('Band ID required')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('band_id', bandId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}
