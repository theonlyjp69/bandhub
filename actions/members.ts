'use server'

import { createClient } from '@/lib/supabase/server'

export async function getBandMembers(bandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid input')

  // Verify user is a member of this band
  const { data: membership } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!membership) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('band_members')
    .select(`
      *,
      profiles(id, display_name, avatar_url)
    `)
    .eq('band_id', bandId)

  if (error) throw error
  return data
}

export async function updateMemberRole(memberId: string, role: 'admin' | 'member') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!memberId || typeof memberId !== 'string') throw new Error('Invalid input')
  if (!['admin', 'member'].includes(role)) throw new Error('Invalid role')

  // Get the target member to find band_id
  const { data: targetMember } = await supabase
    .from('band_members')
    .select('band_id, user_id')
    .eq('id', memberId)
    .single()

  if (!targetMember || !targetMember.band_id) throw new Error('Member not found')

  // Verify current user is an admin of this band
  const { data: currentUserMembership } = await supabase
    .from('band_members')
    .select('role')
    .eq('band_id', targetMember.band_id)
    .eq('user_id', user.id)
    .single()

  if (!currentUserMembership) throw new Error('Access denied')
  if (currentUserMembership.role !== 'admin') throw new Error('Admin required')

  const { error } = await supabase
    .from('band_members')
    .update({ role })
    .eq('id', memberId)

  if (error) throw new Error('Operation failed')
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!memberId || typeof memberId !== 'string') throw new Error('Invalid input')

  // Get the target member to find band_id and user_id
  const { data: targetMember } = await supabase
    .from('band_members')
    .select('band_id, user_id')
    .eq('id', memberId)
    .single()

  if (!targetMember || !targetMember.band_id) throw new Error('Member not found')

  // Check if user is removing themselves (always allowed)
  const isSelfRemoval = targetMember.user_id === user.id

  if (!isSelfRemoval) {
    // Verify current user is an admin of this band
    const { data: currentUserMembership } = await supabase
      .from('band_members')
      .select('role')
      .eq('band_id', targetMember.band_id)
      .eq('user_id', user.id)
      .single()

    if (!currentUserMembership) throw new Error('Access denied')
    if (currentUserMembership.role !== 'admin') throw new Error('Admin required')
  }

  const { error } = await supabase
    .from('band_members')
    .delete()
    .eq('id', memberId)

  if (error) throw new Error('Operation failed')
}
