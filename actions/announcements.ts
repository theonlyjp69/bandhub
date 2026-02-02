'use server'

import { createClient } from '@/lib/supabase/server'

export async function createAnnouncement(bandId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid band ID')
  if (!content || typeof content !== 'string') throw new Error('Invalid content')
  if (title && typeof title !== 'string') throw new Error('Invalid title')

  // Input length limits
  if (title && title.length > 200) throw new Error('Title too long (max 200)')
  if (content.length > 5000) throw new Error('Content too long (max 5000)')

  // Verify user is an admin of this band
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!adminMember) throw new Error('Access denied: admin only')

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      band_id: bandId,
      title,
      content,
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

export async function getBandAnnouncements(bandId: string) {
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
    .from('announcements')
    .select(`
      *,
      profiles!created_by(display_name, avatar_url)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!announcementId || typeof announcementId !== 'string') throw new Error('Invalid announcement ID')

  // Get announcement to verify access
  const { data: announcement } = await supabase
    .from('announcements')
    .select('band_id, created_by')
    .eq('id', announcementId)
    .single()

  if (!announcement || !announcement.band_id) throw new Error('Announcement not found')

  // Check if user is creator or admin
  const isCreator = announcement.created_by === user.id
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', announcement.band_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!isCreator && !adminMember) throw new Error('Access denied')

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (error) throw error
}
