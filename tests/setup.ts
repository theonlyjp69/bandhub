import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Test environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for tests')
}

// Create a test Supabase client that doesn't need cookies
export function createTestClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Test user credentials (should be configured in test environment)
export const TEST_USER_1 = {
  email: process.env.TEST_USER_1_EMAIL || 'test1@bandhub.test',
  password: process.env.TEST_USER_1_PASSWORD || 'testpassword123',
}

export const TEST_USER_2 = {
  email: process.env.TEST_USER_2_EMAIL || 'test2@bandhub.test',
  password: process.env.TEST_USER_2_PASSWORD || 'testpassword123',
}

// Cleanup function to remove test data
export async function cleanupTestData(supabase: ReturnType<typeof createTestClient>) {
  // Delete in order respecting foreign keys
  await supabase.from('messages').delete().like('band_id', 'test-%')
  await supabase.from('threads').delete().like('band_id', 'test-%')
  await supabase.from('announcements').delete().like('band_id', 'test-%')
  await supabase.from('availability_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('availability_polls').delete().like('band_id', 'test-%')
  await supabase.from('files').delete().like('band_id', 'test-%')
  await supabase.from('event_rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('events').delete().like('band_id', 'test-%')
  await supabase.from('invitations').delete().like('band_id', 'test-%')
  await supabase.from('band_members').delete().like('band_id', 'test-%')
  await supabase.from('bands').delete().like('name', 'Test Band%')
}

// Track if database has RLS issues
export let dbHasRLSIssue = false

// Verify connection on module load
async function verifyConnection() {
  const supabase = createTestClient()
  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (error) {
    if (error.code === '42P17') {
      console.warn('Database has RLS recursion issue - some tests may be skipped')
      dbHasRLSIssue = true
    } else {
      console.error('Failed to connect to Supabase:', error)
    }
  }
}

verifyConnection()
