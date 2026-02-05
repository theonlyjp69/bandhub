'use server'

import { createClient } from '@/lib/supabase/server'

type VoteResponse = 'available' | 'maybe' | 'unavailable'
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Verifies user is a member of the band that owns the event.
 * Returns the event's band_id if authorized.
 */
async function verifyEventMembership(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<string> {
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

  return event.band_id
}

export async function submitVote(
  eventId: string,
  slotKey: string,
  response: VoteResponse
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')
  if (!slotKey) throw new Error('Slot key required')
  if (!['available', 'maybe', 'unavailable'].includes(response)) {
    throw new Error('Invalid response')
  }

  // Input length limit for slotKey
  if (slotKey.length > 200) throw new Error('Slot key too long (max 200)')

  await verifyEventMembership(supabase, eventId, user.id)

  // Upsert - create or update vote
  const { data, error } = await supabase
    .from('poll_votes')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      slot_key: slotKey,
      response
    }, {
      onConflict: 'event_id,user_id,slot_key'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEventVotes(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventMembership(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('poll_votes')
    .select(`
      *,
      profiles(id, display_name, avatar_url)
    `)
    .eq('event_id', eventId)

  if (error) throw error
  return data
}

export async function getUserVotes(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null
  if (!eventId) throw new Error('Event ID required')

  await verifyEventMembership(supabase, eventId, user.id)

  const { data, error } = await supabase
    .from('poll_votes')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) throw error
  return data
}

interface VoteCounts {
  available: number
  maybe: number
  unavailable: number
  total: number
}

interface SlotResult {
  slotKey: string
  counts: VoteCounts
  voters: Array<{
    userId: string
    displayName: string | null
    avatarUrl: string | null
    response: VoteResponse
  }>
}

export async function getPollResults(eventId: string): Promise<SlotResult[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventMembership(supabase, eventId, user.id)

  const { data: votes, error } = await supabase
    .from('poll_votes')
    .select(`
      slot_key,
      response,
      user_id,
      profiles(display_name, avatar_url)
    `)
    .eq('event_id', eventId)

  if (error) throw error

  // Aggregate by slot_key
  const slotMap = new Map<string, SlotResult>()

  for (const vote of votes ?? []) {
    const slotKey = vote.slot_key
    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, {
        slotKey,
        counts: { available: 0, maybe: 0, unavailable: 0, total: 0 },
        voters: []
      })
    }

    const slot = slotMap.get(slotKey)!
    const response = vote.response as VoteResponse
    slot.counts[response]++
    slot.counts.total++

    const profile = vote.profiles as { display_name: string | null; avatar_url: string | null } | null
    slot.voters.push({
      userId: vote.user_id,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      response
    })
  }

  return Array.from(slotMap.values())
}

interface SlotSummary {
  slotKey: string
  available: number
  maybe: number
  unavailable: number
  total: number
}

export async function getPollSummary(eventId: string): Promise<SlotSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!eventId) throw new Error('Event ID required')

  await verifyEventMembership(supabase, eventId, user.id)

  const { data: votes, error } = await supabase
    .from('poll_votes')
    .select('slot_key, response')
    .eq('event_id', eventId)

  if (error) throw error

  // Aggregate counts by slot_key
  const slotMap = new Map<string, SlotSummary>()

  for (const vote of votes ?? []) {
    const slotKey = vote.slot_key
    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, {
        slotKey,
        available: 0,
        maybe: 0,
        unavailable: 0,
        total: 0
      })
    }

    const slot = slotMap.get(slotKey)!
    const response = vote.response as VoteResponse
    slot[response]++
    slot.total++
  }

  return Array.from(slotMap.values())
}
