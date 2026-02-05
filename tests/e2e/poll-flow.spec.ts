import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Poll Voting and Resolution
 *
 * Prerequisites: Authenticated users, existing poll event
 * Status: Skipped - requires test auth setup
 */
test.describe.skip('Poll Flow', () => {
  test('shows poll voting UI for active poll', async ({ page }) => {
    await page.goto('/band/test-band-id/events/test-poll-id')

    await expect(page.getByText('Vote on Available Times')).toBeVisible()
    await expect(page.getByText('Availability Poll')).toBeVisible()
  })

  test('can vote on poll options', async ({ page }) => {
    await page.goto('/band/test-band-id/events/test-poll-id')

    await page.getByRole('button', { name: /Available/i }).first().click()

    await expect(page.getByText(/recorded/i)).toBeVisible()
  })

  test('creator can resolve poll', async ({ page }) => {
    await page.goto('/band/test-band-id/events/test-poll-id')

    await expect(page.getByRole('button', { name: /Confirm This Time/i }).first()).toBeVisible()

    await page.getByRole('button', { name: /Confirm This Time/i }).first().click()

    // Accept confirmation dialog
    page.on('dialog', dialog => dialog.accept())

    await expect(page.getByText(/confirmed/i)).toBeVisible()
  })

  test('resolved poll shows RSVP section', async ({ page }) => {
    await page.goto('/band/test-band-id/events/test-resolved-poll-id')

    await expect(page.getByText('Time Confirmed')).toBeVisible()
    await expect(page.getByText('Your RSVP')).toBeVisible()
  })

  test('can RSVP with note on resolved poll', async ({ page }) => {
    await page.goto('/band/test-band-id/events/test-resolved-poll-id')

    await page.getByRole('button', { name: /Going/i }).click()
    await page.getByPlaceholder(/Add a note/i).fill('Bringing my guitar')

    await page.getByRole('button', { name: /Going/i }).click()
  })
})
