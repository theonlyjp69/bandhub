'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyBandMembers } from './notifications'
import type { Json } from '@/types/database'

interface PollOption {
  slotKey: string
  date: string
  startTime: string
  endTime: string
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Verifies user can manage an event (creator or band admin).
 * Throws if not authorized.
 */
async function verifyEventManageAccess(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<void> {
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
}

/**
 * Verifies user is a member of the specified band.
 */
async function verifyBandMembership(
  supabase: SupabaseClient,
  bandId: string,
  userId: string
): Promise<void> {
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .single()

  if (!member) throw new Error('Access denied')
}

interface CreateEventInput {
  bandId: string
  title: string
  eventType: 'show' | 'rehearsal' | 'meeting' | 'recording' | 'photoshoot' | 'deadline' | 'other'
  startTime: string
  endTime?: string
  location?: string
  description?: string
  metadata?: Record<string, unknown>
  // Unified model fields
  mode?: 'fixed' | 'poll'
  pollOptions?: PollOption[]
  pollClosesAt?: string
  rsvpDeadline?: string
  requireRsvp?: boolean
  visibility?: 'band' | 'private'
  visibleUserIds?: string[]
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

  await verifyBandMembership(supabase, input.bandId, user.id)

  // Set defaults for unified model fields
  const mode = input.mode ?? 'fixed'
  const visibility = input.visibility ?? 'band'
  const requireRsvp = input.requireRsvp ?? false

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
      created_by: user.id,
      mode,
      poll_options: input.pollOptions ? (input.pollOptions as unknown as Json) : null,
      poll_closes_at: input.pollClosesAt,
      rsvp_deadline: input.rsvpDeadline,
      require_rsvp: requireRsvp,
      visibility,
      status: 'open'
    })
    .select()
    .single()

  if (error) throw error

  // If visibility is private and visibleUserIds provided, insert into event_visibility
  if (visibility === 'private' && input.visibleUserIds && input.visibleUserIds.length > 0) {
    const visibilityInserts = input.visibleUserIds.map(userId => ({
      event_id: data.id,
      user_id: userId
    }))

    const { error: visibilityError } = await supabase
      .from('event_visibility')
      .insert(visibilityInserts)

    if (visibilityError) {
      // Clean up the event if visibility insert fails
      await supabase.from('events').delete().eq('id', data.id)
      throw visibilityError
    }
  }

  // Notify band members about the new event
  try {
    await notifyBandMembers(input.bandId, 'event_created', {
      title: `New event: ${input.title}`,
      body: mode === 'poll' ? 'Vote on available times' : `${input.eventType} on ${new Date(input.startTime).toLocaleDateString()}`,
      link: `/band/${input.bandId}/events/${data.id}`,
      eventId: data.id,
      excludeUserId: user.id,
      visibility,
      visibleUserIds: input.visibleUserIds
    })
  } catch {
    // Don't fail event creation if notifications fail
    console.error('Failed to send event creation notifications')
  }

  return data
}

export async function updateEvent(eventId: string, updates: Partial<Omit<CreateEventInput, 'bandId'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventManageAccess(supabase, eventId, user.id)

  // Map input field names to database column names
  const fieldMap: Record<string, string> = {
    title: 'title',
    eventType: 'event_type',
    startTime: 'start_time',
    endTime: 'end_time',
    location: 'location',
    description: 'description',
    metadata: 'metadata',
    mode: 'mode',
    pollOptions: 'poll_options',
    pollClosesAt: 'poll_closes_at',
    rsvpDeadline: 'rsvp_deadline',
    requireRsvp: 'require_rsvp',
    visibility: 'visibility'
  }

  const updateData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && fieldMap[key]) {
      updateData[fieldMap[key]] = value
    }
  }

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
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

  await verifyEventManageAccess(supabase, eventId, user.id)

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

  await verifyBandMembership(supabase, bandId, user.id)

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
        note,
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

  await verifyBandMembership(supabase, bandId, user.id)

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

export async function resolvePoll(eventId: string, slotKey: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')
  if (!slotKey) throw new Error('Slot key required')

  await verifyEventManageAccess(supabase, eventId, user.id)

  // Fetch event details for poll resolution
  const { data: event } = await supabase
    .from('events')
    .select('mode, poll_options')
    .eq('id', eventId)
    .single()

  if (!event || event.mode !== 'poll') throw new Error('Event is not a poll')

  // Find the selected slot from poll_options to get the start/end time
  const pollOptions = event.poll_options as PollOption[] | null
  const selectedSlot = pollOptions?.find(opt => opt.slotKey === slotKey)

  if (!selectedSlot) throw new Error('Invalid slot key')

  // Update event with resolved time
  const { data, error } = await supabase
    .from('events')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_slot_key: slotKey,
      start_time: `${selectedSlot.date}T${selectedSlot.startTime}`,
      end_time: `${selectedSlot.date}T${selectedSlot.endTime}`,
      status: 'open'
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error

  // Notify band members about the poll resolution
  if (data.band_id) {
    try {
      await notifyBandMembers(data.band_id, 'poll_resolved', {
        title: `Time confirmed: ${data.title}`,
        body: `Event scheduled for ${new Date(data.start_time).toLocaleDateString()}`,
        link: `/band/${data.band_id}/events/${data.id}`,
        eventId: data.id,
        excludeUserId: user.id,
        visibility: data.visibility as 'band' | 'private' | undefined
      })
    } catch {
      console.error('Failed to send poll resolution notifications')
    }
  }

  return data
}

export async function cancelEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventManageAccess(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error

  // Notify band members about the cancellation
  if (data.band_id) {
    try {
      await notifyBandMembers(data.band_id, 'event_cancelled', {
        title: `Event cancelled: ${data.title}`,
        body: 'This event has been cancelled',
        link: `/band/${data.band_id}/events/${data.id}`,
        eventId: data.id,
        excludeUserId: user.id,
        visibility: data.visibility as 'band' | 'private' | undefined
      })
    } catch {
      console.error('Failed to send event cancellation notifications')
    }
  }

  return data
}

export async function closeEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventManageAccess(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('events')
    .update({ status: 'closed' })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVisibleEvents(bandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId) throw new Error('Band ID required')

  await verifyBandMembership(supabase, bandId, user.id)

  // Get all events where:
  // 1. visibility = 'band' (visible to all band members), OR
  // 2. visibility = 'private' AND user is in event_visibility, OR
  // 3. visibility = 'private' AND user is the creator
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_rsvps(user_id, status),
      profiles!created_by(display_name),
      event_visibility(user_id)
    `)
    .eq('band_id', bandId)
    .order('start_time', { ascending: true })

  if (error) throw error

  // Filter events based on visibility rules
  const visibleEvents = data?.filter(event => {
    if (event.visibility === 'band') return true
    if (event.created_by === user.id) return true
    // Check if user is in event_visibility for private events
    const visibilityEntries = event.event_visibility as { user_id: string }[] | null
    return visibilityEntries?.some(v => v.user_id === user.id) ?? false
  })

  // Remove event_visibility from response (internal data)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return visibleEvents?.map(({ event_visibility, ...rest }) => rest) ?? []
}
