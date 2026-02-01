'use server'

import { createClient } from '@/lib/supabase/server'

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export async function createInvitation(bandId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid input')
  if (!email || typeof email !== 'string') throw new Error('Invalid email')
  if (!isValidEmail(email)) throw new Error('Invalid email format')

  // Verify current user is an admin of this band
  const { data: membership } = await supabase
    .from('band_members')
    .select('role')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!membership) throw new Error('Access denied')
  if (membership.role !== 'admin') throw new Error('Admin required')

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('band_id', bandId)
    .eq('email', email)
    .eq('status', 'pending')
    .single()

  if (existing) throw new Error('Invitation already pending for this email')

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

  if (error) throw new Error('Operation failed')
  return data
}

export async function getUserInvitations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!user.email) throw new Error('User email required')

  // Filter invitations by user's email address
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      bands(id, name),
      profiles!invited_by(display_name)
    `)
    .eq('status', 'pending')
    .eq('email', user.email)

  if (error) throw error
  return data
}

export async function acceptInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!user.email) throw new Error('User email required')
  if (!invitationId || typeof invitationId !== 'string') throw new Error('Invalid input')

  // Get invitation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (!invitation) throw new Error('Invitation not found')

  // Verify the invitation is for this user's email
  if (invitation.email !== user.email) {
    throw new Error('This invitation is not for you')
  }

  // Verify invitation is still pending
  if (invitation.status !== 'pending') {
    throw new Error('Invitation already processed')
  }

  // Add user to band
  const { error: memberError } = await supabase
    .from('band_members')
    .insert({
      band_id: invitation.band_id,
      user_id: user.id,
      role: 'member'
    })

  if (memberError) throw new Error('Failed to join band')

  // Update invitation status
  const { error: updateError } = await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId)

  if (updateError) throw new Error('Failed to update invitation')
}

export async function declineInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!user.email) throw new Error('User email required')
  if (!invitationId || typeof invitationId !== 'string') throw new Error('Invalid input')

  // Get invitation to verify it belongs to this user
  const { data: invitation } = await supabase
    .from('invitations')
    .select('email, status')
    .eq('id', invitationId)
    .single()

  if (!invitation) throw new Error('Invitation not found')

  // Verify the invitation is for this user's email
  if (invitation.email !== user.email) {
    throw new Error('This invitation is not for you')
  }

  // Verify invitation is still pending
  if (invitation.status !== 'pending') {
    throw new Error('Invitation already processed')
  }

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)

  if (error) throw new Error('Operation failed')
}
