'use server'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

interface DateOption {
  date: string         // ISO date
  start_time: string   // HH:MM
  end_time: string     // HH:MM
}

interface CreatePollInput {
  bandId: string
  title: string
  description?: string
  dateOptions: DateOption[]
  closesAt?: string
}

export async function createAvailabilityPoll(input: CreatePollInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!input.bandId || !input.title || !input.dateOptions?.length) {
    throw new Error('Missing required fields')
  }

  // Input length limits
  if (input.title.length > 200) throw new Error('Title too long (max 200)')
  if (input.description && input.description.length > 2000) throw new Error('Description too long (max 2000)')
  if (input.dateOptions.length > 50) throw new Error('Too many date options (max 50)')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', input.bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('availability_polls')
    .insert({
      band_id: input.bandId,
      title: input.title,
      description: input.description,
      date_options: input.dateOptions as unknown as Json,
      closes_at: input.closesAt,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getBandPolls(bandId: string) {
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
    .from('availability_polls')
    .select(`
      *,
      profiles!created_by(display_name),
      availability_responses(user_id)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPoll(pollId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!pollId) throw new Error('Poll ID required')

  // Get poll first
  const { data: poll, error } = await supabase
    .from('availability_polls')
    .select(`
      *,
      profiles!created_by(display_name),
      availability_responses(
        user_id,
        available_slots,
        profiles(display_name, avatar_url)
      )
    `)
    .eq('id', pollId)
    .single()

  if (error) throw error
  if (!poll || !poll.band_id) throw new Error('Poll not found')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', poll.band_id)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  return poll
}

export async function submitAvailability(pollId: string, availableSlots: number[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!pollId) throw new Error('Poll ID required')
  if (!Array.isArray(availableSlots)) throw new Error('Invalid slots')

  // Validate array contents: must be non-negative integers
  if (!availableSlots.every(slot =>
    typeof slot === 'number' &&
    Number.isInteger(slot) &&
    slot >= 0 &&
    slot < 1000  // Reasonable upper bound
  )) {
    throw new Error('Invalid slot values')
  }

  // Verify user is a member of the band this poll belongs to
  const { data: poll } = await supabase
    .from('availability_polls')
    .select('band_id')
    .eq('id', pollId)
    .single()

  if (!poll || !poll.band_id) throw new Error('Poll not found')

  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', poll.band_id)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  // Upsert - create or update response
  const { data, error } = await supabase
    .from('availability_responses')
    .upsert({
      poll_id: pollId,
      user_id: user.id,
      available_slots: availableSlots as unknown as Json
    }, {
      onConflict: 'poll_id,user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserAvailability(pollId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null
  if (!pollId) throw new Error('Poll ID required')

  // Verify user is a member of the band this poll belongs to
  const { data: poll } = await supabase
    .from('availability_polls')
    .select('band_id')
    .eq('id', pollId)
    .single()

  if (!poll || !poll.band_id) throw new Error('Poll not found')

  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', poll.band_id)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('availability_responses')
    .select('*')
    .eq('poll_id', pollId)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function deletePoll(pollId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!pollId) throw new Error('Poll ID required')

  // Get poll and verify access (creator or admin)
  const { data: poll } = await supabase
    .from('availability_polls')
    .select('band_id, created_by')
    .eq('id', pollId)
    .single()

  if (!poll || !poll.band_id) throw new Error('Poll not found')

  // Check if user is creator or admin
  const isCreator = poll.created_by === user.id
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', poll.band_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!isCreator && !adminMember) throw new Error('Access denied')

  const { error } = await supabase
    .from('availability_polls')
    .delete()
    .eq('id', pollId)

  if (error) throw error
}

// Helper: Find best time slot (most responses)
export async function getBestTimeSlot(pollId: string) {
  const poll = await getPoll(pollId)
  if (!poll) return null

  const responses = poll.availability_responses || []
  const slotCounts: Record<number, number> = {}

  // Count responses per slot
  responses.forEach((response) => {
    const slots = response.available_slots as number[] | null
    if (Array.isArray(slots)) {
      slots.forEach((slotIndex: number) => {
        slotCounts[slotIndex] = (slotCounts[slotIndex] || 0) + 1
      })
    }
  })

  // Find slot with most responses
  let bestSlot = -1
  let maxCount = 0
  Object.entries(slotCounts).forEach(([slot, count]) => {
    if (count > maxCount) {
      maxCount = count
      bestSlot = parseInt(slot)
    }
  })

  if (bestSlot === -1) return null

  const dateOptions = poll.date_options as unknown as DateOption[]

  // Validate slot index is within bounds
  if (!Array.isArray(dateOptions) || bestSlot >= dateOptions.length) {
    return null  // Invalid poll data or corrupted responses
  }

  return {
    slotIndex: bestSlot,
    dateOption: dateOptions[bestSlot],
    respondentCount: maxCount,
    totalMembers: responses.length
  }
}
