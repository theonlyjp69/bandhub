'use server'

import { createClient } from '@/lib/supabase/server'

export async function createInvitation(bandId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      band_id: bandId,
      email,
      invited_by: user.id,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserInvitations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get user's email from profile or auth
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      bands(id, name),
      profiles!invited_by(display_name)
    `)
    .eq('status', 'pending')

  if (error) throw error
  return data
}

export async function acceptInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get invitation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (!invitation) throw new Error('Invitation not found')

  // Add user to band
  await supabase
    .from('band_members')
    .insert({
      band_id: invitation.band_id,
      user_id: user.id,
      role: 'member'
    })

  // Update invitation status
  await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId)
}

export async function declineInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)

  if (error) throw error
}
