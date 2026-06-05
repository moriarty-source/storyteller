import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  // Expect the main title or header to be visible
  const title = await page.locator('text=Story Maker').first();
  await expect(title).toBeVisible();
});