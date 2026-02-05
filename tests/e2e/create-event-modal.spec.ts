import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Create Event Modal
 *
 * Prerequisites: Authenticated user in a band
 * Status: Skipped - requires test auth setup
 */
test.describe.skip('Create Event Modal', () => {
  test('can create fixed time event', async ({ page }) => {
    await page.goto('/band/test-band-id')

    await page.getByRole('button', { name: /Create Event/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByLabel('Title').fill('Test Show')
    await page.getByLabel('Event Type').selectOption('show')
    await page.getByLabel('Date').fill('2026-06-01')
    await page.getByLabel('Start Time').fill('20:00')
    await page.getByLabel('Location').fill('Test Venue')

    await page.getByRole('button', { name: /Create/i }).click()

    await expect(page.getByText(/created/i)).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('can create availability poll', async ({ page }) => {
    await page.goto('/band/test-band-id')

    await page.getByRole('button', { name: /Create Event/i }).click()
    await page.getByRole('button', { name: /Find a Time/i }).click()

    await page.getByLabel('Title').fill('Band Practice Poll')
    await page.getByLabel('Event Type').selectOption('rehearsal')

    await page.getByLabel('Date').first().fill('2026-06-01')
    await page.getByLabel('Start Time').first().fill('18:00')
    await page.getByLabel('End Time').first().fill('20:00')

    await page.getByRole('button', { name: /Create Poll/i }).click()

    await expect(page.getByText(/created/i)).toBeVisible()
  })

  test('shows member selector for private visibility', async ({ page }) => {
    await page.goto('/band/test-band-id')

    await page.getByRole('button', { name: /Create Event/i }).click()
    await page.getByLabel('Visibility').selectOption('private')

    await expect(page.getByText(/Select all/i)).toBeVisible()
  })
})
