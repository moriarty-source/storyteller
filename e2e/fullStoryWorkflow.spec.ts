// Full Story Workflow E2E test using Playwright
import { test, expect } from '@playwright/test';

// Helper to generate a long text (>60 words) for unlocking choices
function longText(): string {
  return Array(61).fill('Wort').join(' ');
}

test('author creates complete story, admin marks completed, view displays story', async ({ page }) => {
  // 1. Create new story
  await page.goto('/');
  await page.getByRole('button', { name: /Neue Geschichte starten/i }).click();

  // Capture story code from URL (e.g., /story/ABCD)
  await expect(page).toHaveURL(/\/story\/[A-Z0-9]{4}/);
  const storyUrl = page.url();
  const codeMatch = storyUrl.match(/\/story\/([A-Z0-9]{4})/);
  const code = codeMatch ? codeMatch[1] : '';

  // 2. Fill world (step 1)
  await page.fill('#world-description', 'Eine fantastische Welt voller Wunder');
  await page.fill('#world-problem', 'Ein drohendes Unheil bedroht das Gleichgewicht');
  await page.getByRole('button', { name: /Weiter zu meiner Figur/i }).click();

  // 3. Fill character (step 2)
  await page.fill('#char-name', 'Lena');
  // Choose first strength button (Mutig)
  await page.getByRole('button', { name: 'Mutig' }).click();
  await page.fill('#char-weakness', 'Zu ängstlich');
  await page.fill('#char-goal', 'Den Schatz finden');
  await page.getByRole('button', { name: /Weiter zum Abenteuer/i }).click();

  // 4. Fill each station (1..6)
  for (let stationId = 1; stationId <= 6; stationId++) {
    // Fill main story text with long content to unlock choices
    await page.fill(`#station-text-${stationId}`, longText());

    // Station 1‑5 require exactly 2 choices (meta.minChoices = 2)
    if (stationId <= 5) {
      // Wait for the add‑choice button (it appears after 60+ words)
      const addChoiceBtn = page.getByRole('button', { name: '+ Entscheidung hinzufügen' });
      await addChoiceBtn.waitFor({ state: 'visible', timeout: 5000 });

      // Add first choice
      await addChoiceBtn.click();
      // Add second choice
      await addChoiceBtn.click();

      // Fill labels and consequences for both choices
      await page.fill(`#choice-label-0`, `Option A${stationId}`);
      await page.fill(`#choice-consequence-0`, `Konsequenz A${stationId}`);
      await page.fill(`#choice-label-1`, `Option B${stationId}`);
      await page.fill(`#choice-consequence-1`, `Konsequenz B${stationId}`);
    }

    // Click navigation "Weiter →" unless this is the last station (6)
    if (stationId < 6) {
      await page.getByRole('button', { name: 'Weiter →' }).click();
    }
  }

  // At this point the story authoring is finished (station 6 has no next button)
  // 5. Admin: log in and mark story as completed
  await page.goto('/admin');
  // Default admin password is "admin"
  await page.fill('input[type="password"]', 'admin');
  await page.getByRole('button', { name: 'Einloggen' }).click();

  // Find the story row by its code and click the complete button
  const row = page.locator(`text=${code}`).first().locator('..').locator('..'); // move to the row element
  await row.getByRole('button', { name: 'Abschließen' }).click();

  // 6. Verify view page displays the completed story
  await page.goto(`/story/${code}/view`);
  await expect(page).toHaveURL(`/story/${code}/view`);
  // Verify character name appears
  await expect(page.getByText('Lena', { exact: true })).toBeVisible();
  // Verify a station title appears (e.g., "Ruf zum Abenteuer")
  await expect(page.getByText('RUF ZUM ABENTEUER')).toBeVisible();
});
