'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendMessage(bandId: string, content: string, threadId?: string, eventId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid band ID')
  if (!content || typeof content !== 'string') throw new Error('Invalid content')
  if (threadId && typeof threadId !== 'string') throw new Error('Invalid thread ID')
  if (eventId && typeof eventId !== 'string') throw new Error('Invalid event ID')

  // Input length limits
  if (content.length > 5000) throw new Error('Content too long (max 5000)')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  // If threadId provided, verify thread belongs to this band
  if (threadId) {
    const { data: thread } = await supabase
      .from('threads')
      .select('band_id')
      .eq('id', threadId)
      .single()

    if (!thread || thread.band_id !== bandId) {
      throw new Error('Thread not found')
    }
  }

  // If eventId provided, verify event belongs to this band
  if (eventId) {
    const { data: event } = await supabase
      .from('events')
      .select('band_id')
      .eq('id', eventId)
      .single()

    if (!event || event.band_id !== bandId) {
      throw new Error('Event not found')
    }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      band_id: bandId,
      thread_id: threadId ?? null,
      event_id: eventId ?? null,
      user_id: user.id,
      content
    })
    .select(`
      *,
      profiles!user_id(display_name, avatar_url)
    `)
    .single()

  if (error) throw error
  return data
}

export async function getMessages(bandId: string, threadId?: string, eventId?: string, limit = 50) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid band ID')
  if (threadId && typeof threadId !== 'string') throw new Error('Invalid thread ID')
  if (eventId && typeof eventId !== 'string') throw new Error('Invalid event ID')
  if (typeof limit !== 'number' || limit < 1 || limit > 500) throw new Error('Invalid limit (must be 1-500)')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const baseQuery = supabase
    .from('messages')
    .select(`
      *,
      profiles!user_id(display_name, avatar_url)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: true })
    .limit(limit)

  // Three-way scoping: event chat, thread chat, or main chat
  let query
  if (eventId) {
    query = baseQuery.eq('event_id', eventId)
  } else if (threadId) {
    query = baseQuery.eq('thread_id', threadId)
  } else {
    query = baseQuery.is('thread_id', null).is('event_id', null)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!messageId || typeof messageId !== 'string') throw new Error('Invalid message ID')

  // Get message to verify access
  const { data: message } = await supabase
    .from('messages')
    .select('band_id, user_id')
    .eq('id', messageId)
    .single()

  if (!message || !message.band_id) throw new Error('Message not found')

  // Check if user is the message author or an admin
  const isAuthor = message.user_id === user.id
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', message.band_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!isAuthor && !adminMember) throw new Error('Access denied')

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error
}
