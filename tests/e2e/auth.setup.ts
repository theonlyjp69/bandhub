import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const testUser1Email = process.env.TEST_USER_1_EMAIL
const testUser1Password = process.env.TEST_USER_1_PASSWORD

const authFile = path.join(__dirname, '.auth/user.json')

setup.describe.configure({ mode: 'serial' })

setup('authenticate', async ({ page }) => {
  // Skip if test user credentials are not available
  if (!testUser1Email || !testUser1Password) {
    console.log('Skipping auth setup: TEST_USER_1 credentials not set')
    // Create empty auth state to prevent file not found errors
    const authDir = path.dirname(authFile)
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true })
    }
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  // Create Supabase client and sign in
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testUser1Email,
    password: testUser1Password,
  })

  if (error) {
    console.error('Auth setup failed:', error.message)
    // Create empty auth state
    const authDir = path.dirname(authFile)
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true })
    }
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  // Navigate to the app and set auth tokens in localStorage
  await page.goto('/')

  // Set the Supabase auth tokens in localStorage
  const session = data.session
  if (session) {
    await page.evaluate((sessionData) => {
      const storageKey = `sb-${new URL(sessionData.url).hostname.split('.')[0]}-auth-token`
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
        expires_in: sessionData.expires_in,
        token_type: sessionData.token_type,
        user: sessionData.user,
      }))
    }, {
      url: supabaseUrl,
      ...session,
    })
  }

  // Save storage state
  await page.context().storageState({ path: authFile })
})
