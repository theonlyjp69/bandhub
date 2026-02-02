import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Create an authenticated Supabase client for testing.
 * Signs in with email/password and returns an authenticated client.
 */
export async function createAuthenticatedClient(email: string, password: string) {
  const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(`Failed to authenticate test user ${email}: ${error.message}`)
  }

  return { supabase, user: data.user, session: data.session }
}

/**
 * Create an unauthenticated Supabase client for testing.
 */
export function createUnauthenticatedClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

/**
 * Generate a unique test band name
 */
export function generateTestBandName() {
  return `Test Band ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Wait for a condition to be true, polling at intervals
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await condition()) return
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw new Error('Condition timeout')
}

/**
 * Create a band with the authenticated user as admin
 */
export async function createTestBand(
  supabase: ReturnType<typeof createSupabaseClient<Database>>,
  userId: string,
  name?: string
) {
  const bandName = name || generateTestBandName()

  const { data: band, error } = await supabase
    .from('bands')
    .insert({ name: bandName, created_by: userId })
    .select()
    .single()

  if (error) throw new Error(`Failed to create test band: ${error.message}`)

  const { error: memberError } = await supabase
    .from('band_members')
    .insert({ band_id: band.id, user_id: userId, role: 'admin' })

  if (memberError) throw new Error(`Failed to add admin: ${memberError.message}`)

  return band
}

/**
 * Add a member to a band
 */
export async function addBandMember(
  supabase: ReturnType<typeof createSupabaseClient<Database>>,
  bandId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
) {
  const { error } = await supabase
    .from('band_members')
    .insert({ band_id: bandId, user_id: userId, role })

  if (error) throw new Error(`Failed to add member: ${error.message}`)
}

/**
 * Cleanup a specific band and all related data
 */
export async function cleanupBand(
  supabase: ReturnType<typeof createSupabaseClient<Database>>,
  bandId: string
) {
  // Delete in order respecting foreign keys
  await supabase.from('messages').delete().eq('band_id', bandId)
  await supabase.from('threads').delete().eq('band_id', bandId)
  await supabase.from('announcements').delete().eq('band_id', bandId)
  await supabase.from('availability_polls').delete().eq('band_id', bandId)
  await supabase.from('files').delete().eq('band_id', bandId)
  await supabase.from('events').delete().eq('band_id', bandId)
  await supabase.from('invitations').delete().eq('band_id', bandId)
  await supabase.from('band_members').delete().eq('band_id', bandId)
  await supabase.from('bands').delete().eq('id', bandId)
}
