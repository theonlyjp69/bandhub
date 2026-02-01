'use server'

import { createClient } from '@/lib/supabase/server'

export async function createBand(name: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Create band
  const { data: band, error } = await supabase
    .from('bands')
    .insert({ name, description, created_by: user.id })
    .select()
    .single()

  if (error) throw error

  // Add creator as admin
  await supabase
    .from('band_members')
    .insert({ band_id: band.id, user_id: user.id, role: 'admin' })

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

  const { data, error } = await supabase
    .from('bands')
    .select('*')
    .eq('id', bandId)
    .single()

  if (error) throw error
  return data
}
