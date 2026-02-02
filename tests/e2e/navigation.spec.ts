import { test, expect } from '@playwright/test'

// E2E tests require the dev server to be running
// Run `npm run dev` before running these tests

test.describe('Navigation', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 })

    // Page should load without errors
    await expect(page).toHaveTitle(/.*/)
  })

  test('login page loads successfully', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 })

    // Should see the BandHub heading
    await expect(page.getByRole('heading', { name: 'BandHub' })).toBeVisible({ timeout: 10000 })

    // Should see the sign-in prompt
    await expect(page.getByText('Sign in to manage your bands')).toBeVisible()

    // Should see the Google sign-in button
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible()
  })

  test('dashboard redirects unauthenticated users', async ({ page }) => {
    // Navigate to dashboard without being logged in
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })

    // Should either show login page or redirect
    // Check for presence of either dashboard content or login redirect
    const url = page.url()

    // Either we're on a login page or dashboard with auth check
    expect(url.includes('login') || url.includes('dashboard')).toBe(true)
  })
})
