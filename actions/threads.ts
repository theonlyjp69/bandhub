'use server'

import { createClient } from '@/lib/supabase/server'

export async function createThread(bandId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid band ID')
  if (!title || typeof title !== 'string') throw new Error('Invalid title')

  // Input length limits
  if (title.length > 200) throw new Error('Title too long (max 200)')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('threads')
    .insert({
      band_id: bandId,
      title,
      created_by: user.id
    })
    .select(`
      *,
      profiles!created_by(display_name, avatar_url)
    `)
    .single()

  if (error) throw error
  return data
}

export async function getBandThreads(bandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid band ID')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('threads')
    .select(`
      *,
      profiles!created_by(display_name),
      messages(count)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getThread(threadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!threadId || typeof threadId !== 'string') throw new Error('Invalid thread ID')

  // Get thread first
  const { data: thread, error } = await supabase
    .from('threads')
    .select(`
      *,
      profiles!created_by(display_name, avatar_url)
    `)
    .eq('id', threadId)
    .single()

  if (error) throw error
  if (!thread || !thread.band_id) throw new Error('Thread not found')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', thread.band_id)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  return thread
}

export async function deleteThread(threadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!threadId || typeof threadId !== 'string') throw new Error('Invalid thread ID')

  // Get thread to verify access
  const { data: thread } = await supabase
    .from('threads')
    .select('band_id, created_by')
    .eq('id', threadId)
    .single()

  if (!thread || !thread.band_id) throw new Error('Thread not found')

  // Check if user is creator or admin
  const isCreator = thread.created_by === user.id
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', thread.band_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!isCreator && !adminMember) throw new Error('Access denied')

  const { error } = await supabase
    .from('threads')
    .delete()
    .eq('id', threadId)

  if (error) throw error
}
