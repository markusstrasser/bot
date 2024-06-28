import { test, expect } from '@playwright/test';

test('AI Component Generation', async ({ page }) => {
  await page.goto('/');
  
  // Test with valid input
  await page.fill('input', 'Create a button component');
  await page.click('button[type="submit"]');
  await expect(page.locator('h1')).toHaveText('Component Preview');
  
  // Check for the generated component button
  const generatedComponent = page.locator('[data-testid="generated-component"] button');
  await expect(generatedComponent).toBeVisible();
  await expect(generatedComponent).toHaveText('Click me!');

  // Test code toggle
  const showCodeButton = page.getByRole('button', { name: 'Show Code' });
  await showCodeButton.click();
  await expect(page.locator('pre')).toBeVisible();

  // Test with invalid input
  await page.goto('/');
  await page.fill('input', 'a');
  await page.click('button[type="submit"]');
  await expect(page.locator('p.text-red-500')).toBeVisible();
});