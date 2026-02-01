'use server'

import { createClient } from '@/lib/supabase/server'

export async function createBand(name: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!name || typeof name !== 'string') throw new Error('Name required')
  if (name.length > 100) throw new Error('Name too long (max 100 characters)')
  if (description && description.length > 500) throw new Error('Description too long (max 500 characters)')

  // Create band
  const { data: band, error } = await supabase
    .from('bands')
    .insert({ name, description, created_by: user.id })
    .select()
    .single()

  if (error) throw error

  // Add creator as admin
  const { error: memberError } = await supabase
    .from('band_members')
    .insert({ band_id: band.id, user_id: user.id, role: 'admin' })

  if (memberError) {
    // Rollback: delete the orphaned band
    await supabase.from('bands').delete().eq('id', band.id)
    throw new Error('Failed to create band')
  }

  return band
}

export async function getUserBands() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('bands')
    .select(`
      *,
      band_members!inner(user_id)
    `)
    .eq('band_members.user_id', user.id)

  if (error) throw error
  return data
}

export async function getBand(bandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId || typeof bandId !== 'string') throw new Error('Invalid input')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('bands')
    .select('*')
    .eq('id', bandId)
    .single()

  if (error) throw error
  return data
}
