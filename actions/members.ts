'use server'

import { createClient } from '@/lib/supabase/server'

export async function getBandMembers(bandId: string) {
  const supabase = await createClient()

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

  const { error } = await supabase
    .from('band_members')
    .update({ role })
    .eq('id', memberId)

  if (error) throw error
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('band_members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
}
