import { test, expect } from '@playwright/test';

test('AI Component Generation', async ({ page }) => {
  await page.goto('/');
  
  // Test with valid input
  await page.fill('input', 'Create a button component');
  await page.click('button[type="submit"]');
  await expect(page.locator('h1')).toHaveText('Component Preview');
  await expect(page.locator('button')).toBeVisible();

  // Test with invalid input
  await page.goto('/');
  await page.fill('input', 'a');
  await page.click('button[type="submit"]');
  await expect(page.locator('p.text-red-500')).toBeVisible();

  // Test code toggle
  await page.goto('/');
  await page.fill('input', 'Create a button component');
  await page.click('button[type="submit"]');
  await page.click('button:has-text("Show Code")');
  await expect(page.locator('pre')).toBeVisible();
});