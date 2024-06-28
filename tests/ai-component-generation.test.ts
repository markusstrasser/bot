import { test, expect } from '@playwright/test';

test('AI Component Generation', async ({ page }) => {
  await page.goto('/');
  
  // Fill in the prompt
  await page.fill('input', 'Create a button component');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for the generated component to appear
  await page.waitForSelector('pre');
  
  // Check if the generated code contains a button
  const generatedCode = await page.textContent('pre');
  expect(generatedCode).toContain('<button');
  
  // Check if the file name is displayed
  const fileName = await page.textContent('h2');
  expect(fileName).toContain('.svelte');
});
